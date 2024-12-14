use serde::Serialize;
use tokio::sync::broadcast::Sender;
use tracing::error;

use crate::protocol::serialize::message_container::FrontendMessage;

#[allow(clippy::module_name_repetitions)] // We want to be explicit here
pub fn send_to_frontend<T: Serialize + Clone>(
    frontend_channel: &Sender<String>,
    msg: &FrontendMessage<T>,
) {
    match serde_json::to_string(&msg) {
        Ok(json) => {
            if let Err(e) = frontend_channel.send(json) {
                error!("Failed to send user list to frontend: {}", e);
            }
        }
        Err(e) => {
            error!("Failed to serialize user list: {}", e);
        }
    }
}
