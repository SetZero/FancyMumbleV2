use base64::{engine::general_purpose, Engine as _};
use std::collections::{hash_map::Entry, HashMap};

use serde::{Deserialize, Serialize};
use tracing::{debug, info, trace};

use crate::{
    errors::AnyError,
    mumble,
    protocol::serialize::message_container::FrontendMessage,
    utils::{
        file::{read_data_from_cache, store_data_in_cache},
        frontend::send_to_frontend,
        messages::message_builder,
    },
};
use std::path::PathBuf;
use super::Update;
use tokio::sync::broadcast::Sender;
use tauri::Manager as TauriManager;

#[derive(Debug, Clone, Copy, Serialize, PartialEq)]
enum HashUserFields {
    ProfilePicture,
    Comment,
}

//for now we allow this, because we want to keep the struct as close to the protobuf as possible
#[allow(clippy::struct_excessive_bools)]
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct User {
    pub id: u32,
    pub name: String,
    channel_id: u32,
    mute: bool,
    deaf: bool,
    suppress: bool,
    self_mute: bool,
    self_deaf: bool,
    priority_speaker: bool,
    recording: bool,
    profile_picture_hash: Vec<u8>,
    #[serde(skip_serializing)] // We don't want to send such a big blob to the frontend
    profile_picture: Vec<u8>,
    comment_hash: Vec<u8>,
    #[serde(skip_serializing)] // We don't want to send such a big blob to the frontend
    comment: String,
}

#[allow(clippy::struct_excessive_bools)]
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct UpdateableUserState {
    pub id: Option<u32>,
    pub name: Option<String>,
    pub channel_id: Option<u32>,
    pub mute: Option<bool>,
    pub deaf: Option<bool>,
    pub suppress: Option<bool>,
    pub self_mute: Option<bool>,
    pub self_deaf: Option<bool>,
    pub priority_speaker: Option<bool>,
    pub recording: Option<bool>,
    pub profile_picture_hash: Option<Vec<u8>>,
    pub profile_picture: Option<Vec<u8>>,
    pub comment_hash: Option<Vec<u8>>,
    pub comment: Option<String>,
}

#[derive(Debug, Default, Serialize, Deserialize, Clone)]
pub struct SyncInfo {
    pub session: Option<u32>,
    pub max_bandwidth: Option<u32>,
    pub welcome_text: Option<String>,
    pub permissions: Option<u64>,
}

#[derive(Debug, Default, Serialize)]
pub struct BlobData {
    pub user_id: u32,
    pub data: String,
}

impl Update<mumble::proto::UserState> for User {
    fn update_from(&mut self, other: &mut mumble::proto::UserState) -> &Self {
        // update everything except for hash fields
        Self::update_if_some(&mut self.id, &mut other.session);
        Self::update_if_some(&mut self.name, &mut other.name);
        Self::update_if_some(&mut self.channel_id, &mut other.channel_id);
        Self::update_if_some(&mut self.mute, &mut other.mute);
        Self::update_if_some(&mut self.deaf, &mut other.deaf);
        Self::update_if_some(&mut self.suppress, &mut other.suppress);
        Self::update_if_some(&mut self.self_mute, &mut other.self_mute);
        Self::update_if_some(&mut self.self_deaf, &mut other.self_deaf);
        Self::update_if_some(&mut self.priority_speaker, &mut other.priority_speaker);
        Self::update_if_some(&mut self.recording, &mut other.recording);
        Self::update_if_some(&mut self.profile_picture, &mut other.texture);
        Self::update_if_some(&mut self.comment, &mut other.comment);

        self
    }
}

pub struct Manager {
    users: HashMap<u32, User>,
    frontend_channel: Sender<String>,
    server_channel: Sender<Vec<u8>>,
    app_handle: tauri::AppHandle,
}

impl Manager {
    pub fn new(
        send_to: Sender<String>,
        server_channel: Sender<Vec<u8>>,
        app_handle: tauri::AppHandle,
    ) -> Self {
        Self {
            users: HashMap::new(),
            frontend_channel: send_to,
            server_channel,
            app_handle,
        }
    }

    fn notify_update(&self, session: u32) {
        if let Some(user) = self.users.get(&session) {
            let msg = FrontendMessage::new("user_update", &user);

            send_to_frontend(&self.frontend_channel, &msg);
        }
    }

    fn notify_remove(&self, session: u32) {
        let msg = FrontendMessage::new("user_remove", session);

        send_to_frontend(&self.frontend_channel, &msg);
    }

    fn notify_user_image(&self, session: u32) -> AnyError<()> {
        if let Some(user) = self.users.get(&session) {
            store_data_in_cache(&user.profile_picture_hash, &user.profile_picture, &self.app_handle.path().app_data_dir()?)?;

            let base64 = format!(
                "data:image/png;base64,{}",
                general_purpose::STANDARD.encode(&user.profile_picture)
            );

            let user_image = BlobData {
                user_id: user.id,
                data: base64,
            };
            let msg = FrontendMessage::new("user_image", &user_image);

            send_to_frontend(&self.frontend_channel, &msg);
        }

        Ok(())
    }

    fn notify_user_comment(&self, session: u32) -> AnyError<()> {
        trace!("notify_user_comment: {}", session);
        if let Some(user) = self.users.get(&session) {
            if user.comment_hash.is_empty() {
                return Ok(());
            }

            store_data_in_cache(&user.comment_hash, user.comment.as_bytes(), &self.app_handle.path().app_data_dir()?)?;

            let user_image = BlobData {
                user_id: user.id,
                data: user.comment.clone(),
            };
            let msg = FrontendMessage::new("user_comment", &user_image);

            send_to_frontend(&self.frontend_channel, &msg);
        }

        Ok(())
    }

    fn fill_user_images(&self, user: &User, texture_hash: &Vec<u8>) -> AnyError<()> {
        let cached_user_texture_hash = &user.profile_picture_hash;

        if texture_hash == cached_user_texture_hash {
            trace!(
                "User image is up to date: {:?} vs {:?}",
                texture_hash,
                cached_user_texture_hash
            );
            return Ok(());
        }
        trace!("User image is not up to date for user {}", user.id);

        let no_texture_hash_available = cached_user_texture_hash.is_empty();
        let texture_hash_in_current_message = !texture_hash.is_empty();

        if no_texture_hash_available && texture_hash_in_current_message {
            let blob_request = mumble::proto::RequestBlob {
                session_texture: vec![user.id],
                ..Default::default()
            };
            self.server_channel.send(message_builder(&blob_request)?)?;
        }

        Ok(())
    }

    fn fill_user_comment(&self, user: &User, comment_hash: &Vec<u8>) -> AnyError<()> {
        let cached_user_comment_hash = &user.comment_hash;

        if comment_hash == cached_user_comment_hash {
            trace!(
                "User comment is up to date {:?} vs {:?}",
                comment_hash,
                cached_user_comment_hash
            );
            return Ok(());
        }

        let comment_in_current_message = !comment_hash.is_empty();

        if comment_in_current_message {
            let blob_request = mumble::proto::RequestBlob {
                session_comment: vec![user.id],
                ..Default::default()
            };

            self.server_channel.send(message_builder(&blob_request)?)?;
        }

        Ok(())
    }

    pub fn update_user(&mut self, user_info: &mut mumble::proto::UserState) -> AnyError<()> {
        let texture_hash = user_info.texture_hash.clone().unwrap_or_default();
        let comment_hash = user_info.comment_hash.clone().unwrap_or_default();
        let session = user_info.session();

        let a = self.app_handle.path();
        let updated_from_cache = update_user_comment_and_pfp_from_cache(
            &comment_hash,
            &texture_hash,
            user_info,
            &self.app_handle.path().app_cache_dir()?,
        );

        let has_texture = has_texture(user_info)?;
        let has_comment = has_comment(user_info)?;

        self.insert_or_update_user(session, user_info);

        self.request_user_comment_and_pfp(
            session,
            &updated_from_cache,
            &comment_hash,
            &texture_hash,
        )?;

        self.update_user_hashes(session, texture_hash, comment_hash);

        self.notify_update(session);

        if has_texture {
            debug!("Notifying user image: {}", session);
            self.notify_user_image(session)?;
        }

        if has_comment {
            debug!("Notifying user comment: {}", session);
            self.notify_user_comment(session)?;
        }

        Ok(())
    }

    fn update_user_hashes(&mut self, session: u32, texture_hash: Vec<u8>, comment_hash: Vec<u8>) {
        if let Some(user) = self.users.get_mut(&session) {
            if !texture_hash.is_empty() {
                user.profile_picture_hash = texture_hash;
            }

            if !comment_hash.is_empty() {
                user.comment_hash = comment_hash;
            }
        }
    }

    fn request_user_comment_and_pfp(
        &mut self,
        session: u32,
        updated_from_cache: &[HashUserFields],
        comment_hash: &Vec<u8>,
        texture_hash: &Vec<u8>,
    ) -> AnyError<()> {
        if let Some(user) = self.users.get(&session) {
            if !updated_from_cache.contains(&HashUserFields::Comment) {
                self.fill_user_comment(user, comment_hash)?;
            }

            if !updated_from_cache.contains(&HashUserFields::ProfilePicture) {
                self.fill_user_images(user, texture_hash)?;
            }
        }

        Ok(())
    }

    fn insert_or_update_user(&mut self, session: u32, user_info: &mut mumble::proto::UserState) {
        match self.users.entry(session) {
            Entry::Occupied(mut o) => {
                info!("Updating user: {:?}", o.get().name);
                o.get_mut().update_from(user_info);
            }
            Entry::Vacant(v) => {
                let mut user = User::default();
                info!("Adding user: {:?}", user_info.name);
                user.update_from(user_info);
                v.insert(user);
            }
        };
    }

    pub fn remove_user(&mut self, user_info: &mumble::proto::UserRemove) {
        let session = user_info.session;

        self.users.remove(&session);
        self.notify_remove(session);
    }

    pub fn get_user_by_id(&self, id: u32) -> Option<&User> {
        self.users.get(&id)
    }

    pub fn notify_current_user(&mut self, sync_info: &mumble::proto::ServerSync) {
        let sync_info = SyncInfo {
            session: sync_info.session,
            max_bandwidth: sync_info.max_bandwidth,
            welcome_text: sync_info.welcome_text.clone(),
            permissions: sync_info.permissions,
        };
        let message = FrontendMessage::new("sync_info", sync_info);
        send_to_frontend(&self.frontend_channel, &message);
    }
}

fn update_user_comment_and_pfp_from_cache(
    comment_hash: &Vec<u8>,
    texture_hash: &Vec<u8>,
    user_info: &mut mumble::proto::UserState,
    path: &PathBuf,
) -> Vec<HashUserFields> {
    [
        (HashUserFields::Comment, comment_hash),
        (HashUserFields::ProfilePicture, texture_hash),
    ]
    .iter()
    .filter(|(_, hash)| !hash.is_empty())
    .map(|(field, hash)| (field, read_data_from_cache(hash, &path)))
    .filter_map(|(field, hash)| hash.ok().map(|d| (field, d)))
    .map(|(field, hash)| match field {
        HashUserFields::Comment => {
            user_info.comment = hash.map(|d| String::from_utf8_lossy(&d).to_string());
            HashUserFields::Comment
        }
        HashUserFields::ProfilePicture => {
            user_info.texture = hash;
            HashUserFields::ProfilePicture
        }
    })
    .collect::<Vec<_>>()
}

fn has_texture(user_info: &mumble::proto::UserState) -> AnyError<bool> {
    let has_texture = user_info.texture.is_some()
        && !user_info
            .texture
            .as_ref()
            .ok_or("User texture should not be empty in this context")?
            .is_empty();
    Ok(has_texture)
}

fn has_comment(user_info: &mumble::proto::UserState) -> AnyError<bool> {
    let has_comment = user_info.comment.is_some()
        && !user_info
            .comment
            .as_ref()
            .ok_or("User comment should not be empty in this conext")?
            .is_empty();
    Ok(has_comment)
}
