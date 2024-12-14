pub mod message_container;

use serde::ser::{Serialize, SerializeStruct};

use crate::mumble::proto::{
    user_state, Acl, Authenticate, BanList, ChannelRemove, ChannelState, CodecVersion,
    ContextAction, ContextActionModify, CryptSetup, PermissionDenied, PermissionQuery, Ping,
    QueryUsers, Reject, RequestBlob, ServerConfig, ServerSync, SuggestConfig, TextMessage,
    UdpTunnel, UserList, UserRemove, UserState, UserStats, Version, VoiceTarget,
};

impl Serialize for TextMessage {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut s = serializer.serialize_struct("TextMessage", 7)?;

        s.serialize_field("actor", &self.actor)?;
        s.serialize_field("channel_id", &self.channel_id)?;
        s.serialize_field("message", &self.message)?;
        s.serialize_field("session", &self.session)?;
        s.serialize_field("tree_id", &self.tree_id)?;
        s.serialize_field("timestamp", &self.timestamp)?;
        s.serialize_field("message_id", &self.message_id)?;
        s.end()
    }
}

impl Serialize for Version {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("Version", 0)?;
        s.end()
    }
}

impl Serialize for UdpTunnel {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("UdpTunnel", 0)?;
        s.end()
    }
}

impl Serialize for Authenticate {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("Authenticate", 0)?;
        s.end()
    }
}

impl Serialize for Ping {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut s = serializer.serialize_struct("Ping", 11)?;
        s.serialize_field("timestamp", &self.timestamp)?;
        s.serialize_field("good", &self.good)?;
        s.serialize_field("late", &self.late)?;
        s.serialize_field("lost", &self.lost)?;
        s.serialize_field("resync", &self.resync)?;
        s.serialize_field("udp_packets", &self.udp_packets)?;
        s.serialize_field("tcp_packets", &self.tcp_packets)?;
        s.serialize_field("udp_ping_avg", &self.udp_ping_avg)?;
        s.serialize_field("udp_ping_var", &self.udp_ping_var)?;
        s.serialize_field("tcp_ping_avg", &self.tcp_ping_avg)?;
        s.serialize_field("tcp_ping_var", &self.tcp_ping_var)?;
        s.end()
    }
}

impl Serialize for Reject {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("Reject", 0)?;
        s.end()
    }
}

impl Serialize for ServerSync {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("ServerSync", 0)?;
        s.end()
    }
}

impl Serialize for ChannelRemove {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("ChannelRemove", 0)?;
        s.end()
    }
}

impl Serialize for ChannelState {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut s = serializer.serialize_struct("ChannelState", 12)?;
        s.serialize_field("channel_id", &self.channel_id)?;
        s.serialize_field("parent", &self.parent)?;
        s.serialize_field("name", &self.name)?;
        s.serialize_field("links", &self.links)?;
        s.serialize_field("description", &self.description)?;
        s.serialize_field("links_add", &self.links_add)?;
        s.serialize_field("links_remove", &self.links_remove)?;
        s.serialize_field("temporary", &self.temporary)?;
        s.serialize_field("position", &self.position)?;
        s.serialize_field("description_hash", &self.description_hash)?;
        s.serialize_field("max_users", &self.max_users)?;
        s.serialize_field("is_enter_restricted", &self.is_enter_restricted)?;
        s.serialize_field("can_enter", &self.can_enter)?;
        s.end()
    }
}

impl Serialize for UserRemove {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("UserRemove", 0)?;
        s.end()
    }
}

impl Serialize for UserState {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut s = serializer.serialize_struct("UserState", 22)?;
        s.serialize_field("session", &self.session)?;
        s.serialize_field("actor", &self.actor)?;
        s.serialize_field("name", &self.name)?;
        s.serialize_field("user_id", &self.user_id)?;
        s.serialize_field("channel_id", &self.channel_id)?;
        s.serialize_field("mute", &self.mute)?;
        s.serialize_field("deaf", &self.deaf)?;
        s.serialize_field("suppress", &self.suppress)?;
        s.serialize_field("self_mute", &self.self_mute)?;
        s.serialize_field("self_deaf", &self.self_deaf)?;
        s.serialize_field("texture", &self.texture)?;
        s.serialize_field("plugin_context", &self.plugin_context)?;
        s.serialize_field("plugin_identity", &self.plugin_identity)?;
        s.serialize_field("comment", &self.comment)?;
        s.serialize_field("hash", &self.hash)?;
        s.serialize_field("comment_hash", &self.comment_hash)?;
        s.serialize_field("texture_hash", &self.texture_hash)?;
        s.serialize_field("priority_speaker", &self.priority_speaker)?;
        s.serialize_field("recording", &self.recording)?;
        s.serialize_field("temporary_access_tokens", &self.temporary_access_tokens)?;
        s.serialize_field("listening_channel_add", &self.listening_channel_add)?;
        s.serialize_field("listening_channel_remove", &self.listening_channel_remove)?;
        s.serialize_field(
            "listening_volume_adjustment",
            &self.listening_volume_adjustment,
        )?;
        s.end()
    }
}

impl Serialize for user_state::VolumeAdjustment {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut s = serializer.serialize_struct("VolumeAdjustment", 2)?;
        s.serialize_field("listening_channel", &self.listening_channel)?;
        s.serialize_field("volume_adjustment", &self.volume_adjustment)?;
        s.end()
    }
}

impl Serialize for BanList {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("BanList", 0)?;
        s.end()
    }
}

impl Serialize for PermissionDenied {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("PermissionDenied", 0)?;
        s.end()
    }
}

impl Serialize for Acl {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("Acl", 0)?;
        s.end()
    }
}

impl Serialize for QueryUsers {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("QueryUsers", 0)?;
        s.end()
    }
}

impl Serialize for CryptSetup {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("CryptSetup", 0)?;
        s.end()
    }
}

impl Serialize for ContextActionModify {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("ContextActionModify", 0)?;
        s.end()
    }
}

impl Serialize for ContextAction {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("ContextAction", 0)?;
        s.end()
    }
}

impl Serialize for UserList {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("UserList", 0)?;
        s.end()
    }
}

impl Serialize for VoiceTarget {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("VoiceTarget", 0)?;
        s.end()
    }
}

impl Serialize for PermissionQuery {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("PermissionQuery", 0)?;
        s.end()
    }
}

impl Serialize for CodecVersion {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("CodecVersion", 0)?;
        s.end()
    }
}

impl Serialize for UserStats {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("UserStats", 0)?;
        s.end()
    }
}

impl Serialize for RequestBlob {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("RequestBlob", 0)?;
        s.end()
    }
}

impl Serialize for ServerConfig {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("ServerConfig", 0)?;
        s.end()
    }
}

impl Serialize for SuggestConfig {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = serializer.serialize_struct("SuggestConfig", 0)?;
        s.end()
    }
}
