use rodio::cpal::DeviceNameError;
use serde::Serialize;
use std::ops::Deref;
use std::string::String;

#[derive(Debug, Serialize, Clone)]
pub struct ErrorString(pub String);

impl From<DeviceNameError> for ErrorString {
    fn from(value: DeviceNameError) -> Self {
        Self(value.to_string())
    }
}

impl Deref for ErrorString {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
