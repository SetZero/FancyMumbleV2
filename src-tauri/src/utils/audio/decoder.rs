use std::collections::{btree_map::Entry, BTreeMap};

use crate::{
    errors::AnyError,
    utils::varint::{self},
};

pub struct DecodedMessage {
    pub user_id: u32,
    pub talking: bool,
    pub data: Vec<i16>,
}

pub trait Decoder: Send {
    fn decode_audio(&mut self, audio_data: &[u8]) -> AnyError<DecodedMessage>;
}

#[allow(clippy::struct_field_names)]
#[allow(clippy::module_name_repetitions)]
pub struct UDPDecoder {
    decoder_map: DecoderMap,
    sample_rate: u32,
    channels: opus::Channels,
}

impl UDPDecoder {
    pub fn new(sample_rate: u32, channels: opus::Channels) -> Self {
        Self {
            decoder_map: DecoderMap::new(sample_rate, channels),
            sample_rate,
            channels,
        }
    }
}

impl Decoder for UDPDecoder {
    // we want a downcast, because we are reading from a stream
    #[allow(clippy::cast_possible_truncation)]
    // We are aware of the possible truncation, but we are not using the full range of u32
    #[allow(clippy::cast_sign_loss)]
    fn decode_audio(&mut self, audio_data: &[u8]) -> AnyError<DecodedMessage> {
        let audio_header = audio_data[0];

        let audio_type = (audio_header & 0xE0) >> 5;
        //let audio_target = audio_header & 0x1F;
        if audio_type != 4 {
            return Err(format!("Received audio data with unknown type: {audio_type:?}").into());
        }
        let mut position = 1;

        let session_id = varint::Builder::new()
            .slice(&audio_data[position..])
            .build()?
            .parsed_pair();
        position += session_id.1 as usize;

        let sequence_number = varint::Builder::new()
            .slice(&audio_data[position..])
            .build()?
            .parsed_pair();
        position += sequence_number.1 as usize;

        let opus_header = varint::Builder::new()
            .slice(&audio_data[position..])
            .build()?
            .parsed_pair();
        position += opus_header.1 as usize;

        let talking = (opus_header.0 & 0x2000) <= 0;
        let user_id = session_id.0 as u32;

        // = SampleRate * 60ms = 48000Hz * 0.06s = 2880, ~12KB
        let mut audio_buffer_size = self.sample_rate * 60 / 1000;
        if self.channels == opus::Channels::Stereo {
            audio_buffer_size *= 2;
        }
        let mut decoded_data = vec![0; audio_buffer_size as usize];

        let payload_size = opus_header.0 & 0x1FFF;
        let payload = &audio_data[position..position + payload_size as usize];
        // each user needs their own decoder, because the opus decoder seems to have a bug, which keeps prev. entries. This causes audio glitches
        let decoder = self.decoder_map.get_decoder(user_id)?;
        let num_decoded_samples = decoder.decode(payload, &mut decoded_data, false)?;
        decoded_data.truncate(num_decoded_samples);

        Ok(DecodedMessage {
            user_id,
            talking,
            data: decoded_data,
        })
    }
}

struct DecoderMap {
    sample_rate: u32,
    channels: opus::Channels,
    sink_map: BTreeMap<u32, opus::Decoder>,
}

impl DecoderMap {
    fn new(sample_rate: u32, channels: opus::Channels) -> Self {
        Self {
            sample_rate,
            channels,
            sink_map: BTreeMap::new(),
        }
    }

    fn get_decoder(&mut self, user_id: u32) -> AnyError<&mut opus::Decoder> {
        let result = match self.sink_map.entry(user_id) {
            Entry::Occupied(entry) => entry.into_mut(),
            Entry::Vacant(entry) => {
                entry.insert(Self::create_sink(self.sample_rate, self.channels)?)
            }
        };

        Ok(result)
    }

    fn create_sink(sample_rate: u32, channels: opus::Channels) -> AnyError<opus::Decoder> {
        Ok(opus::Decoder::new(sample_rate, channels)?)
    }
}

// pub struct ProtobufDecoder {
//     decoder_map: DecoderMap,
//     sample_rate: u32,
//     channels: opus::Channels,
// }

// impl ProtobufDecoder {
//     pub fn new(sample_rate: u32, channels: opus::Channels) -> Self {
//         Self {
//             decoder_map: DecoderMap::new(sample_rate, channels),
//             sample_rate,
//             channels,
//         }
//     }
// }

// impl Decoder for ProtobufDecoder {
//     fn decode_audio(&mut self, audio_data: &[u8]) -> AnyError<DecodedMessage> {
//         Err("Not implemented".into())
//     }
// }
