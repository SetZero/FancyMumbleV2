use std::{
    sync::{mpsc::Sender, Arc, Mutex},
    time::Duration,
};

use rodio::{
    cpal::{
        self,
        traits::{HostTrait, StreamTrait},
    },
    DeviceTrait,
};
use tracing::{error, trace};

use crate::errors::{to_error, AnyError};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DeviceConfig {
    pub channels: u16,
    pub sample_rate: u32,
    pub buffer_size: usize,
}

struct InputSettings {
    volume_adjustment: f32,
}

pub struct Microphone {
    input_device: cpal::Device,
    pub device_config: Option<cpal::StreamConfig>,
    tx: Option<Sender<Vec<f32>>>,
    device_info: DeviceConfig,
    stream: Option<cpal::Stream>,
    input_settings: Arc<Mutex<InputSettings>>,
}

impl Microphone {
    pub fn new(tx: Sender<Vec<f32>>) -> AnyError<Self> {
        let buffer_size = usize::pow(2, 10);
        let host = cpal::default_host();

        let input_device = host
            .default_input_device()
            .ok_or("Failed to get default input device")?;

        trace!("Default input device: {:?}", input_device.name());

        let device_config = input_device
            .supported_input_configs()?
            .filter(|c| c.channels() <= 2)
            .max_by(|a, b| a.max_sample_rate().cmp(&b.max_sample_rate()))
            .ok_or("Failed to get max sample rate")?;

        let cpal_buffer_size = cpal::BufferSize::Fixed(u32::try_from(buffer_size)?);
        let config = cpal::StreamConfig {
            channels: device_config.channels(),
            sample_rate: device_config.max_sample_rate(),
            buffer_size: cpal_buffer_size,
        };
        trace!("Using config: {:?}", config);

        let device_info = DeviceConfig {
            channels: config.channels,
            buffer_size,
            sample_rate: config.sample_rate.0,
        };

        let decibel_adjustment = 15.0;
        Ok(Self {
            input_device,
            device_config: Some(config),
            device_info,
            tx: Some(tx),
            stream: None,
            input_settings: Arc::new(Mutex::new(InputSettings {
                volume_adjustment: f32::powf(10.0, decibel_adjustment / 20.0),
            })),
        })
    }

    pub fn volume_adjustment(&self, adjustment: f32) -> AnyError<()> {
        match self.input_settings.lock() {
            Ok(guard) => guard,
            Err(e) => return to_error(&e.to_string()),
        }
        .volume_adjustment = f32::powf(10.0, adjustment / 20.0);
        Ok(())
    }

    pub const fn config(&self) -> DeviceConfig {
        self.device_info
    }

    pub fn start(&mut self) -> AnyError<()> {
        if self.tx.is_none() || self.device_config.is_none() {
            error!("Audio thread already started");
            return Err("Audio thread already started".into());
        }

        let tx = self.tx.take().ok_or("Failed to get audio queue")?;

        let audio_settigns = self.input_settings.clone();
        let callback = move |data: &[f32], _: &cpal::InputCallbackInfo| {
            let mut processed_buffer = data.to_vec();

            let input_settings = audio_settigns
                .lock()
                .expect("Failed to lock input settings");

            for processed_sample in &mut processed_buffer {
                *processed_sample *= input_settings.volume_adjustment;
            }
            drop(input_settings);

            // Add the audio samples to the buffer
            tx.send(processed_buffer)
                .expect("Failed to send audio data");
        };
        let err_fn = |err| error!("an error occurred on stream: {}", err);
        let device_config = self.device_config.clone().ok_or("No device config")?;

        let stream = self.input_device.build_input_stream(
            &device_config,
            callback,
            err_fn,
            Some(Duration::from_secs(10)),
        )?;
        stream.play()?;
        self.stream = Some(stream);
        trace!("Microphone started");

        Ok(())
    }

    pub fn stop(&mut self) -> AnyError<()> {
        if let Some(stream) = self.stream.take() {
            stream.pause()?;
            trace!("Microphone stopped");
        }
        Ok(())
    }
}
