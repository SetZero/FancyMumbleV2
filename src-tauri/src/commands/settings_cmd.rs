use std::{
    fs,
    io::{Read, Seek, SeekFrom, Write},
    sync::RwLock,
};

use reqwest::Identity;
use tauri::State;
use tracing::{info, trace};

use crate::{utils::{constants::get_project_dirs, server::{Server, UserIdentity}}, errors::certificate_error::CertificateError};

use super::utils::settings::FrontendSettings;

const SERVER_SETTINS_FILE: &str = "server.json";
const FRONTEND_SETTINS_FILE: &str = "frontend_settings.json";

pub fn get_settings_file(file_name: &str) -> Result<std::fs::File, String> {
    let project_dirs = get_project_dirs().ok_or("Unable to load project dir")?;
    let data_dir = project_dirs.config_dir();
    std::fs::create_dir_all(data_dir).map_err(|e| format!("{e:?}"))?;
    let settings_file = std::fs::OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open(data_dir.join(file_name))
        .map_err(|e| format!("Error opening file: {e:?}"))?;
    Ok(settings_file)
}

pub fn get_settings_file_location(file_name: &str) -> Result<String, String> {
    let project_dirs = get_project_dirs().ok_or("Unable to load project dir")?;
    let data_dir = project_dirs.config_dir();
    std::fs::create_dir_all(data_dir).map_err(|e| format!("{e:?}"))?;

    Ok(data_dir
        .join(file_name)
        .to_str()
        .ok_or_else(|| "Unable to get file location".to_string())?
        .to_string())
}

#[tauri::command]
pub fn save_server(
    description: &str,
    server_host: &str,
    server_port: u16,
    username: &str,
    identity: Option<String>,
) -> Result<(), String> {
    info!("Saving server: {server_host}:{server_port}");
    let mut server_file = get_settings_file(SERVER_SETTINS_FILE)?;

    // read the json content using serde and append the new server
    let mut server_list =
        serde_json::from_reader::<&std::fs::File, Vec<Server>>(&server_file).unwrap_or_default();

    // // check if the server is already in the list
    // for server in &server_list {
    //     if server.host == server_host && server.port == server_port {
    //         return Err("Server already exists".to_string());
    //     }
    // }

    server_list.push(Server {
        description: description.to_string(),
        host: server_host.to_string(),
        port: server_port,
        username: username.to_string(),
        identity,
    });

    trace!("Server list: {:#?}", server_list);

    // write the new json content
    server_file
        .seek(SeekFrom::Start(0))
        .map_err(|e| format!("{e:?}"))?;
    server_file
        .write_all(
            serde_json::to_string_pretty(&server_list)
                .map_err(|e| format!("{e:?}"))?
                .as_bytes(),
        )
        .map_err(|e| format!("{e:?}"))?;

    Ok(())
}

#[tauri::command]
pub fn get_server_list() -> Result<Vec<Server>, String> {
    info!("Getting server list");
    let project_dirs = get_project_dirs().ok_or("Unable to load project dir")?;

    let data_dir = project_dirs.config_dir();

    // create config dir if it doesn't exist
    std::fs::create_dir_all(data_dir).map_err(|e| format!("{e:?}"))?;

    // open server.json or create it if it doesn't exist
    let server_file = std::fs::OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open(data_dir.join(SERVER_SETTINS_FILE))
        .map_err(|e| format!("Error opening file: {e:?}"))?;

    // read the json content using serde
    let server_list =
        serde_json::from_reader::<&std::fs::File, Vec<Server>>(&server_file).unwrap_or_default();

    trace!("Server list: {:#?}", server_list);

    Ok(server_list)
}

pub struct FrontendSettingsState {
    pub state: RwLock<bool>,
}

#[allow(clippy::needless_pass_by_value)] // LinkPreview needs to be deserialized
#[allow(clippy::significant_drop_tightening)] // we need this to prevent simultaneous writes
#[tauri::command]
pub fn save_frontend_settings(
    state: State<'_, FrontendSettingsState>,
    settings_name: &str,
    data: FrontendSettings,
) -> Result<(), String> {
    trace!("Saving frontend settings: {settings_name}");

    trace!("Settings data: {:#?}", data);
    let lock = state.state.write();
    if let Err(e) = lock {
        return Err(format!("Error locking write state: {}", e.get_ref()));
    }
    let data = serde_json::to_string_pretty(&data).map_err(|e| format!("{e:?}"))?;

    fs::write(
        get_settings_file_location(&format!("{settings_name}_{FRONTEND_SETTINS_FILE}"))?,
        data,
    )
    .map_err(|e| format!("{e:?}"))?;

    Ok(())
}

// State is passed by value by tauri
#[allow(clippy::needless_pass_by_value)]
#[tauri::command]
pub fn get_frontend_settings(
    state: State<'_, FrontendSettingsState>,
    settings_name: &str,
) -> Result<String, String> {
    info!("Getting frontend settings: {settings_name}");
    let mut settings_file = get_settings_file(&format!("{settings_name}_{FRONTEND_SETTINS_FILE}"))?;

    if let Err(e) = state.state.read() {
        return Err(format!("Error locking write state: {}", e.get_ref()));
    }

    let mut settings_data = String::new();
    settings_file
        .read_to_string(&mut settings_data)
        .map_err(|e| format!("{e:?}"))?;

    trace!("Settings data: {:#?}", settings_data);

    Ok(settings_data)
}


#[tauri::command]
pub fn get_identity_certs() -> Result<Vec<String>, String> {
    let project_dirs = get_project_dirs()
        .ok_or_else(|| CertificateError::new("Unable to load project dir")).map_err(|e| format!("{:?}", e))?;
    let data_dir = project_dirs.data_dir();

    if !data_dir.exists() {
        std::fs::create_dir_all(&data_dir).map_err(|e| format!("{:?}", e))?;
    }

    let mut certs = Vec::new();

    let dir_entries = fs::read_dir(&data_dir)
        .map_err(|e| format!("Error reading directory: {}", e))?;

    for entry in dir_entries {
        let entry = entry.map_err(|e| format!("Error reading directory entry: {}", e))?;
        let file_name = entry.file_name();
        let file_name_str = file_name.to_string_lossy();

        if file_name_str.starts_with("cert_") && file_name_str.ends_with(".pem") {
            let cert_name = file_name_str
                .trim_start_matches("cert_")
                .trim_end_matches(".pem")
                .to_owned();
            certs.push(cert_name);
        }
    }

    Ok(certs)
}