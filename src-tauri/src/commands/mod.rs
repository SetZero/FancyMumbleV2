// clippy is detecting '_ as a underscore binding, which it shouldn't
#![allow(clippy::used_underscore_binding)]

mod helper;
pub mod settings_cmd;
pub mod utils;
pub mod web_cmd;
pub mod zip_cmd;

use std::{borrow::BorrowMut, collections::HashMap, path::Path, sync::Arc};

use crate::{
    connection::{traits::Shutdown, Connection},
    errors::string_convertion::ErrorString,
    manager::user::UpdateableUserState,
    protocol::message_transmitter::MessageTransmitter,
    utils::{audio::device_manager::AudioDeviceManager, constants::get_project_dirs},
};
use tauri::{AppHandle, Manager, State};
use tokio::sync::{
    broadcast::{self, Receiver, Sender},
    Mutex,
};
use tracing::{error, info, trace};
use tracing_subscriber::fmt::format;

use self::utils::settings::{
    AudioOptions, AudioOutputSettings, AudioPreviewContainer, AudioUserState, Coordinates,
    GlobalSettings,
};
use image::{
    imageops::{self, FilterType},
    GenericImageView,
};
#[cfg(desktop)]
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

pub struct ConnectionState {
    pub connection: Mutex<Option<Connection>>,
    pub window: Arc<Mutex<tauri::WebviewWindow>>,
    pub package_info: Mutex<tauri::PackageInfo>,
    pub message_handler: Mutex<HashMap<String, Box<dyn Shutdown + Send>>>,
    pub device_manager: Mutex<Option<AudioDeviceManager>>,
    pub settings_channel: Mutex<Option<Sender<GlobalSettings>>>,
}

async fn add_message_handler(
    state: &State<'_, ConnectionState>,
    name: String,
    handler: Box<dyn Shutdown + Send>,
) {
    state.message_handler.lock().await.insert(name, handler);
}

async fn create_settings_channel(state: &State<'_, ConnectionState>) -> Receiver<GlobalSettings> {
    let (sender, recv): (Sender<GlobalSettings>, Receiver<GlobalSettings>) = broadcast::channel(20);
    let mut guard: tokio::sync::MutexGuard<'_, Option<Sender<GlobalSettings>>> =
        state.settings_channel.lock().await;
    let _ = guard.insert(sender);

    recv
}

#[tauri::command]
pub async fn connect_to_server(
    server_host: String,
    server_port: u16,
    username: String,
    identity: Option<String>,
    state: State<'_, ConnectionState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    info!("Connecting to server: {server_host}:{server_port}, username: {username}, identity: {identity:?}");

    let mut guard = state.connection.lock().await;
    if let Some(guard) = guard.as_mut() {
        // close old connection
        if let Err(e) = guard.shutdown().await {
            return Err(format!("{e:?}"));
        }
    }

    let settings_channel = create_settings_channel(&state).await;

    let app_info = state.package_info.lock().await.clone();
    let connection = guard.insert(Connection::new(
        &server_host,
        server_port,
        &username,
        identity,
        app_info,
        settings_channel,
        app_handle
    ));
    if let Err(e) = connection.connect().await {
        return Err(format!("{e:?}"));
    }

    let window = state.window.lock().await;

    let mut transmitter = MessageTransmitter::new(connection.get_message_channel(), window.clone());
    drop(guard);
    drop(window);

    transmitter.start_message_transmit_handler();
    add_message_handler(&state, "transmitter".to_string(), Box::new(transmitter)).await;

    Ok(())
}

// guard can't be dropped any earlier
#[allow(clippy::significant_drop_tightening)]
#[tauri::command]
pub async fn send_message(
    chat_message: String,
    channel_id: Option<u32>,
    reciever: Option<u32>,
    state: State<'_, ConnectionState>,
) -> Result<(), String> {
    let guard = state.connection.lock().await;
    if let Some(guard) = guard.as_ref() {
        if let Err(e) = guard.send_message(channel_id, reciever, &chat_message) {
            return Err(format!("{e:?}"));
        }
    }

    Ok(())
}

#[allow(clippy::significant_drop_tightening)]
#[tauri::command]
pub async fn logout(state: State<'_, ConnectionState>) -> Result<(), String> {
    info!("Got logout request");
    let mut connection = state.connection.lock().await;

    if connection.is_none() {
        return Err("Called logout, but there is no connection!".to_string());
    }

    {
        let mut lock_guard = state.message_handler.lock().await;
        #[allow(clippy::significant_drop_in_scrutinee)]
        for (name, thread) in lock_guard.iter_mut() {
            if let Err(e) = thread.shutdown().await {
                error!("Failed to shutdown thread {}: {}", name, e);
            }
            trace!("Joined {}", name.to_string());
        }
    }

    if let Err(e) = connection
        .as_mut()
        .ok_or("No connection is available, but logout called")?
        .shutdown()
        .await
    {
        return Err(format!("{e:?}"));
    }

    *connection = None;

    Ok(())
}

// guard can't be dropped any earlier
#[allow(clippy::significant_drop_tightening)]
#[tauri::command]
pub async fn like_message(
    message_id: String,
    reciever: Vec<u32>,
    state: State<'_, ConnectionState>,
) -> Result<(), String> {
    let guard = state.connection.lock().await;
    if let Some(guard) = guard.as_ref() {
        if let Err(e) = guard.like_message(&message_id, reciever) {
            return Err(format!("{e:?}"));
        }
    }

    Ok(())
}

// guard can't be dropped any earlier
#[allow(clippy::significant_drop_tightening)]
#[tauri::command]
pub async fn set_user_image(
    image_path: &str,
    image_type: String,
    state: State<'_, ConnectionState>,
) -> Result<(), String> {
    let connection = &state.connection;
    let guard = connection.lock().await;

    if let Some(guard) = guard.as_ref() {
        if let Err(error) = guard.set_user_image(image_path, &image_type) {
            return Err(format!("{error:?}"));
        }
    }

    Ok(())
}

#[allow(clippy::cast_possible_truncation)] // truncation is intentional
#[allow(clippy::cast_sign_loss)] // loss is intentional
#[allow(clippy::cast_precision_loss)] // loss is intentional
#[tauri::command]
pub async fn crop_and_store_image(
    path: &str,
    zoom: f32,
    crop: Coordinates,
    rotation: i32,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("{e:?}"))?;
    let path = Path::new(path);
    let img = image::open(path).map_err(|e| e.to_string())?;

    // Zoom
    let (width, height) = img.dimensions();
    let new_width = (width as f32 * zoom) as u32;
    let new_height = (height as f32 * zoom) as u32;
    let img = img.resize(new_width, new_height, FilterType::Nearest);

    // Rotate
    let img = if rotation == 90 {
        img.rotate90()
    } else if rotation == 180 {
        img.rotate180()
    } else if rotation == 270 {
        img.rotate270()
    } else {
        img
    };

    // Crop
    let crop_x = (crop.x * zoom) as u32;
    let crop_y = (crop.y * zoom) as u32;
    let crop_width = (crop.width * zoom) as u32;
    let crop_height = (crop.height * zoom) as u32;
    let img = imageops::crop_imm(&img, crop_x, crop_y, crop_width, crop_height).to_image();

    // Save the image
    let temp_path = data_dir.join(format!(
        "tmp_img.{}",
        path.extension()
            .map_or_else(|| "", |x| x.to_str().unwrap_or(""))
    ));
    img.save(&temp_path).map_err(|e| e.to_string())?;

    Ok(temp_path.to_str().unwrap_or("").to_string())
}

// guard can't be dropped any earlier
#[allow(clippy::significant_drop_tightening)]
#[tauri::command]
pub async fn change_user_state(
    mut user_state: UpdateableUserState,
    state: State<'_, ConnectionState>,
) -> Result<(), String> {
    let connection = &state.connection;
    let guard = connection.lock().await;
    trace!("Got change user state change request");

    if let Some(guard) = guard.as_ref() {
        if let Err(error) = guard.update_user_info(user_state.borrow_mut()) {
            return Err(format!("{error:?}"));
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn get_audio_devices(
    state: State<'_, ConnectionState>,
) -> Result<Vec<String>, ErrorString> {
    let device_manager = &state.device_manager;
    let mut guard = device_manager.lock().await;

    if guard.is_none() {
        *guard = Some(AudioDeviceManager::new());
    }

    if let Some(guard) = guard.as_mut() {
        if let Ok(mut devices) = guard.get_audio_device() {
            return Ok(devices.drain().map(|d| d.1).collect());
        }
    }
    drop(guard);

    Err(ErrorString("Failed to get audio devices".to_string()))
}

#[tauri::command]
pub async fn set_audio_input_setting(
    state: State<'_, ConnectionState>,
    settings: AudioOptions,
) -> Result<(), String> {
    trace!("Set setting: {:?}", settings);
    state
        .settings_channel
        .lock()
        .await
        .as_ref()
        .map(|x| x.send(GlobalSettings::AudioInputSettings(settings)));
    Ok(())
}

#[tauri::command]
pub async fn set_audio_output_setting(
    state: State<'_, ConnectionState>,
    settings: AudioOutputSettings,
) -> Result<(), String> {
    trace!("Set setting: {:?}", settings);
    state
        .settings_channel
        .lock()
        .await
        .as_ref()
        .map(|x| x.send(GlobalSettings::AudioOutputSettings(settings)));
    Ok(())
}

#[tauri::command]
pub async fn set_audio_user_state(
    state: State<'_, ConnectionState>,
    settings: AudioUserState,
) -> Result<(), String> {
    trace!("Set setting: {:?}", settings);
    state
        .settings_channel
        .lock()
        .await
        .as_ref()
        .map(|x| x.send(GlobalSettings::AudioUserState(settings)));
    Ok(())
}

#[tauri::command]
pub async fn disable_audio_info(state: State<'_, ConnectionState>) -> Result<(), String> {
    state.settings_channel.lock().await.as_ref().map(|x| {
        x.send(GlobalSettings::AudioPreview(AudioPreviewContainer {
            enabled: false,
            window: state.window.clone(),
        }))
    });
    Ok(())
}
#[tauri::command]
pub async fn enable_audio_info(state: State<'_, ConnectionState>) -> Result<(), String> {
    state.settings_channel.lock().await.as_ref().map(|x| {
        x.send(GlobalSettings::AudioPreview(AudioPreviewContainer {
            enabled: true,
            window: state.window.clone(),
        }))
    });
    Ok(())
}

#[cfg(desktop)]
#[allow(clippy::needless_pass_by_value)] // tauri command
#[tauri::command]
pub fn close_app(app: AppHandle) {
    if let Err(e) = app.save_window_state(StateFlags::all()) {
        error!("Failed to save window state: {:?}", e);
    }
    app.exit(0);
}

#[cfg(desktop)]
#[tauri::command]
pub fn dev_tools(app: AppHandle) {
    if let Err(e) = app
        .get_webview_window("main")
        .map_or_else(|| Err(()), |w| Ok(w.open_devtools()))
    {
        error!("Failed to toggle dev tools: {:?}", e);
    }
}
