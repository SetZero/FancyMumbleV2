use num_traits::{self, Num, ToPrimitive};
use std::error::Error;

use crate::errors::{voice_error::VoiceError, AnyError};

fn create_voice_eoi(on: &str) -> Box<dyn Error> {
    Box::new(VoiceError::new(format!("Unexpected end of input for {on}")))
}

pub struct Builder {
    bytes: Option<Vec<u8>>,
    parsed_value: Option<i128>,
    minimum_bytes: Option<u32>,
}

impl Builder {
    pub const fn new() -> Self {
        Self {
            bytes: None,
            parsed_value: None,
            minimum_bytes: None,
        }
    }

    pub fn number<T: Num + ToPrimitive>(mut self, number: &T) -> Self {
        self.parsed_value = number.to_i128();
        self
    }

    pub fn slice(mut self, bytes: &[u8]) -> Self {
        self.bytes = Some(bytes.to_vec());
        self
    }

    pub const fn minimum_bytes(mut self, minimum_bytes: u32) -> Self {
        self.minimum_bytes = Some(minimum_bytes);
        self
    }

    pub fn build(self) -> AnyError<Varint> {
        if self.parsed_value.is_some() && self.bytes.is_some() {
            return Err(Box::new(VoiceError::new(
                "Cannot build from both number and slice",
            )));
        }

        if self.parsed_value.is_none() && self.bytes.is_none() {
            return Err(Box::new(VoiceError::new(
                "Cannot build from neither number nor slice",
            )));
        }

        if self.parsed_value.is_some() {
            let minimum_bytes = if self.minimum_bytes.is_some() {
                self.minimum_bytes.unwrap_or(0)
            } else {
                0
            };

            let bytes = Varint::encode(self.parsed_value.unwrap_or(0), minimum_bytes);

            let bytes = bytes.ok_or("Unable to encode bytes from given value")?;
            return Ok(Varint {
                parsed_value: self
                    .parsed_value
                    .ok_or("unable to parse value from given bytes")?,
                parsed_bytes: u32::try_from(bytes.len())?,
                bytes,
            });
        } else if self.bytes.is_some() {
            let byte_slice = self.bytes.ok_or("Invalid bytes")?;
            let (value, bytes) = Varint::parse(&byte_slice)?;
            return Ok(Varint {
                bytes: byte_slice,
                parsed_value: value,
                parsed_bytes: bytes,
            });
        }

        Err(Box::new(VoiceError::new("Unable to build varint")))
    }
}

pub struct Varint {
    bytes: Vec<u8>,
    pub parsed_value: i128,
    pub parsed_bytes: u32,
}

impl Varint {
    pub const fn parsed_pair(&self) -> (i128, u32) {
        (self.parsed_value, self.parsed_bytes)
    }

    pub const fn parsed_vec(&self) -> &Vec<u8> {
        &self.bytes
    }

    fn parse(bytes: &[u8]) -> AnyError<(i128, u32)> {
        if bytes.is_empty() {
            return Err(Box::new(VoiceError::new("Unexpected end of input")));
        }

        if bytes.is_empty() {
            return Err(create_voice_eoi("varint"));
        }

        let first_byte = bytes[0];
        let value = match first_byte {
            // 7-bit positive number
            0..=127 => (i128::from(u64::from(first_byte)), 1),
            // 14-bit positive number
            128..=191 => {
                if bytes.len() < 2 {
                    return Err(create_voice_eoi("14-bit positive number"));
                }
                let value = u64::from(first_byte & 0b0011_1111) << 8 | u64::from(bytes[1]);
                (i128::from(value), 2)
            }
            // 21-bit positive number
            192..=223 => {
                if bytes.len() < 3 {
                    return Err(create_voice_eoi("21-bit positive number"));
                }
                let value = u64::from(first_byte & 0b0001_1111) << 16
                    | u64::from(bytes[1]) << 8
                    | u64::from(bytes[2]);
                (i128::from(value), 3)
            }
            // 28-bit positive number
            224..=239 => {
                if bytes.len() < 4 {
                    return Err(create_voice_eoi("28-bit positive number"));
                }
                let value = u64::from(first_byte & 0b0000_1111) << 24
                    | u64::from(bytes[1]) << 16
                    | u64::from(bytes[2]) << 8
                    | u64::from(bytes[3]);
                (i128::from(value), 4)
            }

            // 32-bit positive number
            0b1111_0000..=0b1111_0011 => {
                if bytes.len() < 5 {
                    return Err(create_voice_eoi("32-bit positive number"));
                }
                (i128::from(u32::from_be_bytes(bytes[1..=4].try_into()?)), 5)
            }

            // 64-bit positive number
            0b1111_0100..=0b1111_0111 => {
                if bytes.len() < 9 {
                    return Err(create_voice_eoi("64-bit positive number"));
                }
                (i128::from(u64::from_be_bytes(bytes[1..=8].try_into()?)), 9)
            }

            // Negative recursive varint
            0b1111_1000..=0b1111_1011 => {
                let value = Self::parse(&bytes[1..])?;
                (-value.0, value.1 + 1)
            }

            // inverted negative two bit number
            0b1111_1100..=0b1111_1111 => (i128::from(!((first_byte) & 0b0000_0011)), 1),
        };

        Ok(value)
    }

    #[allow(clippy::cast_possible_truncation)]
    #[allow(clippy::cast_sign_loss)]
    fn encode(value: i128, minimum_length: u32) -> Option<Vec<u8>> {
        let mut byte_container = Vec::new();

        match value {
            0..=127 if minimum_length <= 1 => {
                byte_container.push(value as u8);
            }
            ..=16_383 if minimum_length <= 2 => {
                let byte1 = ((value >> 8) & 0b0011_1111) as u8 | 0b1000_0000;
                let byte2 = (value & 0xFF) as u8;
                byte_container.push(byte1);
                byte_container.push(byte2);
            }
            ..=2_097_151 if minimum_length <= 3 => {
                let byte1 = ((value >> 16) & 0b0001_1111) as u8 | 0b1100_0000;
                let byte2 = ((value >> 8) & 0xFF) as u8;
                let byte3 = (value & 0xFF) as u8;
                byte_container.push(byte1);
                byte_container.push(byte2);
                byte_container.push(byte3);
            }
            ..=268_435_455 if minimum_length <= 4 => {
                let byte1 = ((value >> 24) & 0b0000_1111) as u8 | 0b1110_0000;
                let byte2 = ((value >> 16) & 0xFF) as u8;
                let byte3 = ((value >> 8) & 0xFF) as u8;
                let byte4 = (value & 0xFF) as u8;
                byte_container.push(byte1);
                byte_container.push(byte2);
                byte_container.push(byte3);
                byte_container.push(byte4);
            }
            ..=4_294_967_295 if minimum_length <= 5 => {
                byte_container.push(0b1111_0000);
                byte_container.extend_from_slice(&(value as u32).to_be_bytes());
            }
            ..=18_446_744_073_709_551_615 if minimum_length <= 9 => {
                byte_container.push(0b1111_0100);
                byte_container.extend_from_slice(&(value as u64).to_be_bytes());
            }
            ..=-5 => {
                let inverted_value = !value as u128;
                byte_container.push((inverted_value & 0b0011_1111) as u8 | 0b1111_1000);
                byte_container.extend_from_slice(&Self::encode(-value - 1, minimum_length)?);
            }
            -4..=-1 => {
                let inverted_value = u8::try_from(!value).ok()?;
                byte_container.push(inverted_value | 0b1111_1100);
            }
            _ => return None, // Value out of supported range
        }

        Some(byte_container)
    }
}
