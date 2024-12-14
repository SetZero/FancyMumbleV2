use std::error::Error;
use std::fmt::{self, Display};

#[derive(Debug)]
pub struct VoiceError {
    details: String,
}

impl VoiceError {
    pub fn new<T: Display>(msg: T) -> Self {
        Self {
            details: msg.to_string(),
        }
    }
}

impl fmt::Display for VoiceError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.details)
    }
}

impl Error for VoiceError {
    fn description(&self) -> &str {
        &self.details
    }
}
