use crate::{errors::AnyError, mumble};
use byteorder::{BigEndian, ByteOrder};
use prost::{DecodeError, Message};
use serde::Serialize;
use std::any::Any;

#[derive(Debug)]
pub struct MessageInfo {
    pub message_type: MessageTypes,
    pub message_data: Box<dyn Any>,
}

#[derive(Debug, Serialize)]
pub struct MessageSendData<T>
where
    T: Clone,
{
    message_type: MessageTypes,
    data: T,
}

pub trait NetworkMessage {
    fn message_type() -> u16;
}

macro_rules! message_builder {
    ($($value:expr => $proto:ident),*) => {
        $(impl NetworkMessage for mumble::proto::$proto {
            fn message_type() -> u16 {
                $value
            }
        })*

        #[derive(Debug, Clone, Serialize, PartialEq, Eq)]
        pub enum MessageTypes {
            $( $proto ),*
        }

        pub fn get_message(id: u16, buf: &[u8]) -> Result<MessageInfo, DecodeError> {
            match id {
                $( $value => {
                    let value = <mumble::proto::$proto>::decode(buf);
                    match value {
                        Ok(v) => Ok(MessageInfo{ message_type: MessageTypes::$proto, message_data: Box::new(v)} ),
                        Err(e) => Err(e)
                    }
                } ),*
                _ => Err(DecodeError::new("Invalid message")),
            }
        }
    };
}

message_builder! {
    0 => Version,
    1 => UdpTunnel,
    2 => Authenticate,
    3 => Ping,
    4 => Reject,
    5 => ServerSync,
    6 => ChannelRemove,
    7 => ChannelState,
    8 => UserRemove,
    9 => UserState,
    10 => BanList,
    11 => TextMessage,
    12 => PermissionDenied,
    13 => Acl,
    14 => QueryUsers,
    15 => CryptSetup,
    16 => ContextActionModify,
    17 => ContextAction,
    18 => UserList,
    19 => VoiceTarget,
    20 => PermissionQuery,
    21 => CodecVersion,
    22 => UserStats,
    23 => RequestBlob,
    24 => ServerConfig,
    25 => SuggestConfig,
    26 => PluginDataTransmission
}

// If our payload is larger than 32bits, something went wrong
#[allow(clippy::cast_possible_truncation)]
pub fn message_builder<T>(message: &T) -> AnyError<Vec<u8>>
where
    T: NetworkMessage + Message,
{
    let payload = message.encode_to_vec();
    raw_message_builder::<T>(&payload)
}

pub fn raw_message_builder<T>(payload: &[u8]) -> AnyError<Vec<u8>>
where
    T: NetworkMessage + Message,
{
    let message_type = T::message_type();
    let length = payload.len();
    assert!(length < u32::MAX as usize);

    let mut new_buffer = vec![0; length + 6];
    BigEndian::write_u16(&mut new_buffer, message_type);
    BigEndian::write_u32(&mut new_buffer[2..], u32::try_from(length)?);
    new_buffer[6..].copy_from_slice(payload);

    Ok(new_buffer)
}
