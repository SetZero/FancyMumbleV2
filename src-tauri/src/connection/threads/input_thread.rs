use std::sync::atomic::Ordering;

use crate::connection::Connection;
use crate::protocol::message_router::MessageRouter;
use crate::protocol::stream_reader::StreamReader;
use tauri::AppHandle;
use tokio::select;
use tokio::time;

use super::{ConnectionThread, InputThread, DEADMAN_INTERVAL};

impl InputThread for Connection {
    // reader can'T be moved further in, because otherwise message_reader Result type is causing issues
    #[allow(clippy::significant_drop_tightening)]
    fn spawn_input_thread(&mut self) {
        let mut rx_in = self.tx_in.subscribe();
        let running = self.running.clone();
        let message_channels = self.message_channels.clone();
        let back_channel = self.tx_out.clone();

        let reader_copy = self.stream_reader.clone();
        let app_handle_clone = self.app_handle.clone();
        let settings_channel_copy = self.settings_channel.resubscribe();
        self.threads.insert(
            ConnectionThread::Input,
            tokio::spawn(async move {
                let mut interval = time::interval(DEADMAN_INTERVAL);
                {
                    let mut reader = reader_copy.lock().await;
                    let message_reader =
                        MessageRouter::new(message_channels, back_channel, settings_channel_copy, app_handle_clone);

                    match message_reader {
                        Ok(message_reader) => {
                            *reader = Some(StreamReader::new(message_reader));
                        }
                        Err(e) => {
                            eprintln!("Failed to create message reader: {e}");
                        }
                    }
                }

                while running.load(Ordering::Relaxed) {
                    select! {
                        Ok(mut result) = rx_in.recv() => {
                            let mut reader = reader_copy.lock().await;
                            if let Some(reader) = reader.as_mut() {
                                reader.read_next(&mut result);
                            }
                        }

                        _ = interval.tick() => {}
                    }
                }
            }),
        );
    }
}
