use std::collections::HashMap;

use rodio::{
    cpal::{self, traits::HostTrait},
    Device, DeviceTrait,
};

use crate::errors::AnyError;

#[allow(clippy::module_name_repetitions)]
pub struct AudioDeviceManager {
    pub audio_device: Option<Device>,
    pub audio_device_list: HashMap<u64, Device>,
}

impl AudioDeviceManager {
    pub fn new() -> Self {
        Self {
            audio_device: None,
            audio_device_list: HashMap::new(),
        }
    }

    pub fn get_audio_device(&mut self) -> AnyError<HashMap<u64, String>> {
        let host = cpal::default_host();
        let device_list = host.input_devices()?;

        self.audio_device_list = device_list
            .into_iter()
            .enumerate()
            .map(|(i, device)| (i as u64, device))
            .collect::<HashMap<_, _>>();

        self.audio_device_list
            .iter()
            .map(|(i, device)| {
                Ok((
                    *i,
                    device
                        .name()
                        .map_err(|e| format!("Failed to get device name: {e}"))?,
                ))
            })
            .collect::<Result<_, _>>()
    }
}
