#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod connection;
mod errors;
mod manager;
mod mumble;
mod protocol;
mod utils;

#[cfg(test)]
mod tests;

use core::panic;
use std::{collections::HashMap, sync::Arc};

use commands::{web_cmd::CrawlerState, ConnectionState};
use tokio::sync::Mutex;

use tauri::Manager;
use tracing::Level;
use tracing_subscriber::{
    fmt::{self, format::FmtSpan},
    EnvFilter,
};

use crate::commands::{
    change_user_state, close_app, connect_to_server, crop_and_store_image, dev_tools,
    disable_audio_info, enable_audio_info, get_audio_devices, like_message, logout, send_message,
    set_audio_input_setting, set_audio_output_setting, set_audio_user_state, set_user_image,
    settings_cmd::{get_identity_certs, get_server_list, save_server},
    web_cmd::{
        convert_url_to_base64, get_open_graph_data_from_website, get_tenor_search_results,
        get_tenor_trending_results, open_browser,
    },
    zip_cmd::{convert_to_base64, unzip_data_from_utf8, zip_data_to_utf8},
};

fn init_logging() {
    let format = fmt::format()
        .with_level(true)
        .with_target(false)
        .with_thread_ids(false)
        .with_thread_names(false)
        .compact(); // use the `Compact` formatting style.

    tracing_subscriber::fmt()
        .with_max_level(Level::TRACE)
        .event_format(format)
        .with_env_filter(EnvFilter::from_default_env().add_directive(Level::INFO.into()))
        .with_span_events(FmtSpan::CLOSE)
        .init();
}

#[tokio::main(flavor = "multi_thread", worker_threads = 10)]
async fn main() {
    init_logging();

    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
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
            close_app,
            dev_tools
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
