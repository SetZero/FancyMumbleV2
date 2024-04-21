use std::sync::{Arc, RwLock};

use crate::connection::threads::DEADMAN_INTERVAL;
use crate::connection::traits::{HandleMessage, Shutdown};
use crate::errors::AnyError;
use async_trait::async_trait;
use tauri::Manager;
use tokio::task::JoinHandle;
use tokio::time;
use tokio::{select, sync::broadcast::Receiver};
use tracing::{debug, trace};

pub struct MessageTransmitter {
    recv_channel: Receiver<String>,
    window: tauri::WebviewWindow,
    transmitter_thread: Option<JoinHandle<()>>,
    running: Arc<RwLock<bool>>,
}

impl MessageTransmitter {
    pub fn new(recv_channel: Receiver<String>, window: tauri::WebviewWindow) -> Self {
        Self {
            recv_channel,
            window,
            transmitter_thread: None,
            running: Arc::new(RwLock::new(false)),
        }
    }

    pub fn start_message_transmit_handler(&mut self) {
        debug!("Starting MessageTransmitter");

        {
            if let Ok(mut running) = self.running.write() {
                *running = true;
            }
        }

        let mut channel = self.recv_channel.resubscribe();
        let window_clone = self.window.clone();
        let running_clone = self.running.clone();

        self.transmitter_thread = Some(tokio::spawn(async move {
            let mut interval = time::interval(DEADMAN_INTERVAL);

            while *running_clone.read().expect("Failed to get running state") {
                select! {
                    Ok(result) = channel.recv() => {
                        trace!("backend_update received");
                        _ = window_clone.emit("backend_update", result);
                    }
                    _ = interval.tick() => {}
                }
            }
        }));
    }
}

#[async_trait]
impl Shutdown for MessageTransmitter {
    async fn shutdown(&mut self) -> AnyError<()> {
        trace!("Sending Shutdown Request");
        if let Ok(mut running) = self.running.write() {
            *running = false;
        }

        if let Some(transmitter_thread) = self.transmitter_thread.as_mut() {
            transmitter_thread.await?;
            trace!("Joined transmitter_thread");
        }

        Ok(())
    }
}

#[async_trait]
impl HandleMessage for MessageTransmitter {}
