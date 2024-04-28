mod commands;
mod connection;
mod errors;
mod manager;
mod mumble;
mod protocol;
mod utils;

use tauri::App;

use crate::commands::{
    change_user_state, connect_to_server, crop_and_store_image, disable_audio_info,
    enable_audio_info, get_audio_devices, like_message, logout, send_message,
    set_audio_input_setting, set_audio_output_setting, set_audio_user_state, set_user_image,
    settings_cmd::{get_identity_certs, get_server_list, save_server},
    web_cmd::{
        convert_url_to_base64, get_open_graph_data_from_website, get_tenor_search_results,
        get_tenor_trending_results, open_browser,
    },
    zip_cmd::{convert_to_base64, unzip_data_from_utf8, zip_data_to_utf8},
};
use commands::{web_cmd::CrawlerState, ConnectionState};
use std::{collections::HashMap, sync::Arc};
use tauri::Manager;
use tokio::sync::Mutex;

#[cfg(mobile)]
mod mobile;
#[cfg(mobile)]
pub use mobile::*;

pub type SetupHook = Box<dyn FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send>;

#[derive(Default)]
pub struct AppBuilder {
    setup: Option<SetupHook>,
}

impl AppBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn setup<F>(mut self, setup: F) -> Self
    where
        F: FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send + 'static,
    {
        self.setup.replace(Box::new(setup));
        self
    }

    pub fn run(self) {
        let setup = self.setup;
        tauri::Builder::default()
            .plugin(tauri_plugin_store::Builder::default().build())
            .plugin(tauri_plugin_os::init())
            .setup(move |app| {
                app.manage(ConnectionState {
                    connection: Mutex::new(None),
                    window: Arc::new(Mutex::new(
                        app.get_webview_window("main").expect("window not found"),
                    )),
                    package_info: Mutex::new(app.package_info().clone()),
                    message_handler: Mutex::new(HashMap::new()),
                    device_manager: Mutex::new(None),
                    settings_channel: Mutex::new(None),
                });
                app.manage(CrawlerState {
                    crawler: Mutex::new(None),
                });
                if let Some(setup) = setup {
                    (setup)(app)?;
                }
                Ok(())
            })
            .invoke_handler(tauri::generate_handler![
                connect_to_server,
                save_server,
                get_server_list,
                send_message,
                logout,
                like_message,
                set_user_image,
                crop_and_store_image,
                change_user_state,
                get_audio_devices,
                zip_data_to_utf8,
                unzip_data_from_utf8,
                convert_to_base64,
                open_browser,
                get_open_graph_data_from_website,
                get_identity_certs,
                set_audio_input_setting,
                set_audio_output_setting,
                enable_audio_info,
                disable_audio_info,
                get_tenor_search_results,
                get_tenor_trending_results,
                convert_url_to_base64,
                set_audio_user_state,
            ])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
}
