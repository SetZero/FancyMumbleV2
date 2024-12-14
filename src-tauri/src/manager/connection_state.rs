use crate::{
    protocol::serialize::message_container::FrontendMessage, utils::frontend::send_to_frontend,
};

use tokio::sync::broadcast::Sender;

pub struct Manager {
    frontend_channel: Sender<String>,
    _server_channel: Sender<Vec<u8>>,
}

impl Manager {
    pub fn new(send_to: Sender<String>, server_channel: Sender<Vec<u8>>) -> Self {
        Self {
            frontend_channel: send_to,
            _server_channel: server_channel,
        }
    }

    pub fn notify_disconnected(&self, message: &Option<String>) {
        let msg = FrontendMessage::new("disconnected", message);

        send_to_frontend(&self.frontend_channel, &msg);
    }

    pub fn notify_connected(&self) {
        let msg = FrontendMessage::new("connected", &());

        send_to_frontend(&self.frontend_channel, &msg);
    }
}
