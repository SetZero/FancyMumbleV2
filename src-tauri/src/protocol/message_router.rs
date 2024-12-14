#![allow(clippy::match_same_arms)]

use std::error::Error;

use tokio::sync::broadcast::{Receiver, Sender};
use tracing::{error, info, trace, warn};

use crate::{
    commands::utils::settings::GlobalSettings,
    connection::{traits::Shutdown, MessageChannels},
    errors::{application_error::ApplicationError, AnyError},
    manager::{
        channel::{self},
        connection_state, text_message,
        user::{self},
        voice::{self},
    },
    mumble,
    utils::messages::MessageInfo,
};

#[allow(clippy::struct_field_names)]
pub struct MessageRouter {
    user_manager: user::Manager,
    channel_manager: channel::Manager,
    text_manager: text_message::Manager,
    connection_manager: connection_state::Manager,
    voice_manager: voice::Manager,
}

impl MessageRouter {
    pub fn new(
        sender: MessageChannels,
        server_channel: Sender<Vec<u8>>,
        settings_channel: Receiver<GlobalSettings>,
        app_handle: tauri::AppHandle,
    ) -> AnyError<Self> {
        Ok(Self {
            user_manager: user::Manager::new(
                sender.message_channel.clone(),
                server_channel.clone(),
                app_handle.clone(),
            ),
            channel_manager: channel::Manager::new(
                sender.message_channel.clone(),
                server_channel.clone(),
            ),
            text_manager: text_message::Manager::new(sender.message_channel.clone()),
            connection_manager: connection_state::Manager::new(
                sender.message_channel.clone(),
                server_channel.clone(),
            ),
            voice_manager: voice::Manager::new(
                sender.message_channel,
                server_channel,
                settings_channel,
            )?,
        })
    }

    fn handle_downcast<T: 'static>(message_info: MessageInfo) -> AnyError<T> {
        match message_info.message_data.downcast::<T>() {
            Ok(a) => Ok(*a),
            Err(e) => Err(Box::new(ApplicationError::new(
                format!("Invalid message type {e:?}").as_str(),
            ))),
        }
    }

    fn handle_text_message(&mut self, message: MessageInfo) -> AnyError<()> {
        let text_message = Self::handle_downcast::<mumble::proto::TextMessage>(message)?;
        match text_message.actor {
            Some(actor) => {
                let actor = self
                    .user_manager
                    .get_user_by_id(actor)
                    .ok_or_else(|| Box::new(ApplicationError::new("msg")) as Box<dyn Error>)?;
                self.text_manager.add_text_message(text_message, actor);
            }
            None => {
                error!("Received text message without actor: {:?}", text_message);
            }
        }
        Ok(())
    }

    pub fn recv_message(&mut self, message: MessageInfo) -> AnyError<()> {
        if message.message_type != crate::utils::messages::MessageTypes::UdpTunnel {
            trace!("Received message: {:<100?}", message);
        }

        match message.message_type {
            crate::utils::messages::MessageTypes::Version => {}
            crate::utils::messages::MessageTypes::UdpTunnel => {
                let audio_data = Self::handle_downcast::<Vec<u8>>(message)?;
                self.voice_manager.notify_audio(&audio_data)?;
            }
            crate::utils::messages::MessageTypes::Authenticate => {}
            crate::utils::messages::MessageTypes::Ping => {}
            crate::utils::messages::MessageTypes::Reject => {
                let reject = Self::handle_downcast::<mumble::proto::Reject>(message)?;
                self.connection_manager.notify_disconnected(&reject.reason);
                return Err(Box::new(ApplicationError::new(
                    format!("Received reject message: {:?}", reject.reason).as_str(),
                )));
            }
            crate::utils::messages::MessageTypes::ServerSync => {
                let server_sync = Self::handle_downcast::<mumble::proto::ServerSync>(message)?;
                self.user_manager.notify_current_user(&server_sync);
                self.connection_manager.notify_connected();
                self.voice_manager.deafen()?;
            }
            crate::utils::messages::MessageTypes::ChannelRemove => {
                let removed_channel =
                    Self::handle_downcast::<mumble::proto::ChannelRemove>(message)?;
                self.channel_manager.remove_channel(&removed_channel);
            }
            crate::utils::messages::MessageTypes::ChannelState => {
                let mut changed_channel =
                    Self::handle_downcast::<mumble::proto::ChannelState>(message)?;
                self.channel_manager.update_channel(&mut changed_channel)?;
            }
            crate::utils::messages::MessageTypes::UserRemove => {
                let removed_user = Self::handle_downcast::<mumble::proto::UserRemove>(message)?;
                self.user_manager.remove_user(&removed_user);
            }
            crate::utils::messages::MessageTypes::UserState => {
                let mut changed_user = Self::handle_downcast::<mumble::proto::UserState>(message)?;
                self.user_manager.update_user(&mut changed_user)?;
            }
            crate::utils::messages::MessageTypes::BanList => {}
            crate::utils::messages::MessageTypes::TextMessage => {
                self.handle_text_message(message)?;
            }
            crate::utils::messages::MessageTypes::PermissionDenied => {
                let permission_denied =
                    Self::handle_downcast::<mumble::proto::PermissionDenied>(message)?;
                warn!("Permission denied: {:?}", permission_denied);
            }
            crate::utils::messages::MessageTypes::Acl => {}
            crate::utils::messages::MessageTypes::QueryUsers => {}
            crate::utils::messages::MessageTypes::CryptSetup => {}
            crate::utils::messages::MessageTypes::ContextActionModify => {}
            crate::utils::messages::MessageTypes::ContextAction => {}
            crate::utils::messages::MessageTypes::UserList => {}
            crate::utils::messages::MessageTypes::VoiceTarget => {}
            crate::utils::messages::MessageTypes::PermissionQuery => {
                let permission_query =
                    Self::handle_downcast::<mumble::proto::PermissionQuery>(message)?;
                warn!("Permission query: {:?}", permission_query);

                if permission_query.flush() {
                    //TODO: We currently don't support ACLs, so we just disconnect the user
                    //self.shutdown().await?;
                }
            }
            crate::utils::messages::MessageTypes::CodecVersion => {
                let codec_version = Self::handle_downcast::<mumble::proto::CodecVersion>(message)?;
                self.voice_manager.set_codec(&codec_version);
            }
            crate::utils::messages::MessageTypes::UserStats => {}
            crate::utils::messages::MessageTypes::RequestBlob => {}
            crate::utils::messages::MessageTypes::ServerConfig => {}
            crate::utils::messages::MessageTypes::SuggestConfig => {}
            crate::utils::messages::MessageTypes::PluginDataTransmission => {
                info!("Received plugin data transmission");
            }
        };

        Ok(())
    }

    pub async fn shutdown(&mut self) -> AnyError<()> {
        self.voice_manager.shutdown().await?;

        Ok(())
    }
}
