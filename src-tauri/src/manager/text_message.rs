use std::time::{SystemTime, UNIX_EPOCH};

use serde::Serialize;
use tokio::sync::broadcast::Sender;
use tracing::error;

use crate::{mumble, protocol::serialize::message_container::FrontendMessage};

use super::user::User;

#[derive(Debug, Clone, Serialize)]
struct SenderInfo {
    user_id: u32,
    user_name: String,
}

#[derive(Debug, Clone, Serialize)]
struct TextMessage {
    sender: SenderInfo,
    message: String,
    timestamp: u128,
    id: Option<String>,
}

pub struct Manager {
    message_log: Vec<TextMessage>,
    frontend_channel: Sender<String>,
}

impl Manager {
    pub fn new(send_to: Sender<String>) -> Self {
        Self {
            message_log: Vec::new(),
            frontend_channel: send_to,
        }
    }

    fn notify(&self, element: Option<usize>) {
        let result = element.map_or_else(
            || {
                let msg = FrontendMessage::new("text_message", &self.message_log);
                serde_json::to_string(&msg)
            },
            |inner_element| {
                let text = &self.message_log[inner_element];
                let msg = FrontendMessage::new("text_message", text);
                serde_json::to_string(&msg)
            },
        );

        match result {
            Ok(json) => {
                if let Err(e) = self.frontend_channel.send(json) {
                    error!("Failed to send user list to frontend: {}", e);
                }
            }
            Err(e) => {
                error!("Failed to serialize user list: {}", e);
            }
        }
    }

    fn notify_last(&self) {
        let last = self.message_log.len() - 1;
        self.notify(Some(last));
    }

    pub fn add_text_message(&mut self, text_message: mumble::proto::TextMessage, user: &User) {
        let timestamp = text_message.timestamp.map_or_else(
            || {
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis()
            },
            u128::from,
        );

        let message = TextMessage {
            sender: SenderInfo {
                user_id: user.id,
                user_name: user.name.clone(),
            },
            message: text_message.message,
            timestamp,
            id: text_message.message_id,
        };
        self.message_log.push(message);
        self.notify_last();
    }
}
