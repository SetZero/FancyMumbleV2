use std::{
    fs,
    io::{Seek, SeekFrom, Write},
};

use tauri::Manager;
use tracing::{info, trace};

use crate::{errors::certificate_error::CertificateError, utils::server::Server};

const SERVER_SETTINS_FILE: &str = "server.json";

pub fn get_settings_file(file_name: &str, app: &tauri::AppHandle) -> Result<std::fs::File, String> {
    let data_dir = app.path().app_config_dir().map_err(|e| format!("{e:?}"))?;
    std::fs::create_dir_all(&data_dir).map_err(|e| format!("{e:?}"))?;
    let settings_file = std::fs::OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open(data_dir.join(file_name))
        .map_err(|e| format!("Error opening file: {e:?}"))?;
    Ok(settings_file)
}

#[tauri::command]
pub fn save_server(
    description: &str,
    server_host: &str,
    server_port: u16,
    username: &str,
    identity: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    info!("Saving server: {server_host}:{server_port}");
    let mut server_file = get_settings_file(SERVER_SETTINS_FILE, &app_handle)?;

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
pub fn get_server_list(app_handle: tauri::AppHandle) -> Result<Vec<Server>, String> {
    info!("Getting server list");

    let data_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("{e:?}"))?;

    // create config dir if it doesn't exist
    std::fs::create_dir_all(&data_dir).map_err(|e| format!("{e:?}"))?;

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

#[tauri::command]
pub fn get_identity_certs(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("{e:?}"))?;

    if !data_dir.exists() {
        std::fs::create_dir_all(&data_dir).map_err(|e| format!("{e:?}"))?;
    }

    let mut certs = Vec::new();

    let dir_entries =
        fs::read_dir(data_dir).map_err(|e| format!("Error reading directory: {e}"))?;

    for entry in dir_entries {
        let entry = entry.map_err(|e| format!("Error reading directory entry: {e}"))?;
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
