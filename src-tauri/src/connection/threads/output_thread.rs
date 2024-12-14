use std::sync::atomic::Ordering;

use crate::{connection::Connection, mumble, utils::messages::message_builder};
use tokio::select;
use tokio::time;
use tracing::trace;
use tracing::{debug, error};

use super::{ConnectionThread, OutputThread, DEADMAN_INTERVAL};

impl OutputThread for Connection {
    fn spawn_output_thread(&mut self) {
        if self.threads.get(&ConnectionThread::Output).is_some() {
            error!("OutputThread already running");
            return;
        }

        let tx_out = self.tx_out.clone();
        let running = self.running.clone();
        let mut rx_message_channel = self.tx_message_channel.subscribe();

        self.threads.insert(
            ConnectionThread::Output,
            tokio::spawn(async move {
                let mut interval = time::interval(DEADMAN_INTERVAL);

                while running.load(Ordering::Relaxed) {
                    select! {
                        Ok(result) = rx_message_channel.recv() => {
                            debug!("Sending text message to channel: {:?}", result.channel_id);
                            let message = mumble::proto::TextMessage {
                                actor: None,
                                session: result.reciever.iter().copied().collect(),
                                channel_id: result.channel_id.iter().copied().collect(),
                                tree_id: Vec::new(),
                                message: result.message,
                                message_id: None,
                                timestamp: None,
                            };
                            trace!("Sending message: {:?}", message);
                            let buffer = message_builder(&message).unwrap_or_default();

                            if let Err(error) = tx_out.send(buffer) {
                                error!("Unable to send message: {}", error);
                            }
                        }

                        _ = interval.tick() => {}
                    }
                }
            }),
        );
    }
}
