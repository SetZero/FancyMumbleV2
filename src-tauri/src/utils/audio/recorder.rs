use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc::{self},
        Arc,
    },
    thread,
    time::Duration,
};
use tauri::Emitter;

use tokio::sync::broadcast::{self, Receiver};
use tracing::{error, info, trace, warn};

use crate::{
    commands::utils::settings::{AudioOptions, AudioPreviewContainer, GlobalSettings, InputMode},
    errors::AnyError,
    mumble::proto::UdpTunnel,
    utils::{
        audio::{encoder::UDPEncoder, microphone::Microphone, processing::compress::Compressor},
        messages::raw_message_builder,
    },
};

use super::{
    encoder::Encoder,
    processing::voice_activation::{VoiceActivation, VoiceActivationType},
};

pub struct Recorder {
    audio_thread: Option<thread::JoinHandle<()>>,
    playing: Arc<AtomicBool>,
    server_channel: Option<broadcast::Sender<Vec<u8>>>,
    settings_channel: Option<broadcast::Receiver<GlobalSettings>>,
}

impl Recorder {
    pub fn new(
        server_channel: broadcast::Sender<Vec<u8>>,
        settings_channel: broadcast::Receiver<GlobalSettings>,
    ) -> Self {
        Self {
            audio_thread: None,
            playing: Arc::new(AtomicBool::new(false)),
            server_channel: Some(server_channel),
            settings_channel: Some(settings_channel),
        }
    }

    pub fn start(&mut self) -> AnyError<()> {
        if self.audio_thread.is_some() || self.playing.swap(true, Ordering::Relaxed) {
            error!("Audio thread already started");
            return Err("Audio thread already started".into());
        }

        let playing_clone = self.playing.clone();
        let audio_queue_ref = self
            .server_channel
            .take()
            .ok_or("failed to get audio queue")
            .expect("failed to get audio queue");

        let mut settings_channel = self
            .settings_channel
            .take()
            .ok_or("Failed to get Settings Channel, audio thread is possibly already started")?;

        self.audio_thread = Some(thread::spawn(move || {
            trace!("Starting audio thread");

            let (tx, rx) = mpsc::channel();
            let mut microphone = Microphone::new(tx).expect("Failed to create microphone");
            let mut encoder = UDPEncoder::new(microphone.config());
            match microphone.start() {
                Ok(()) => {}
                Err(e) => {
                    error!("Failed to start microphone: {}", e);
                    return;
                }
            }

            trace!("Audio thread started");
            trace!("Playing: {:?}", playing_clone.load(Ordering::Relaxed));

            let mut sequence_number = 0u64;
            let sample_rate = microphone.device_config.as_ref().map_or(0, |config| {
                config.sample_rate.0.try_into().unwrap_or_default()
            });

            let mut va: Option<VoiceActivation<f32>> = Some(VoiceActivation::new(
                sample_rate,
                Duration::from_millis(100),
                Duration::from_secs(1),
                0.6,
                0.3,
            ));
            let mut compressor: Option<Compressor> = Some(Compressor::new(
                sample_rate,
                0.0,
                0.0,
                Duration::from_millis(0),
                Duration::from_millis(0),
            ));

            let mut audio_preview: Option<AudioPreviewContainer> = None;

            while playing_clone.load(Ordering::Relaxed) {
                update_settings(
                    &mut settings_channel,
                    &mut va,
                    &mut compressor,
                    &microphone,
                    &mut audio_preview,
                );
                let mut max_amplitude = 0.0;

                let mut value = rx.recv().expect("Failed to receive audio data");
                if let Some(va) = va.as_mut() {
                    max_amplitude = va.process(&mut value);
                }
                if let Some(compress) = compressor.as_mut() {
                    compress.process(&mut value);
                }

                if let Some(audio_preview) = audio_preview.as_mut() {
                    let _ = audio_preview.window.try_lock().map(|window| {
                        let emit = window.emit("audio_preview", max_amplitude);
                        let _ = emit;
                    });
                }

                let audio_buffer = encoder.encode_audio(&value, &mut sequence_number);

                if let Some(audio_buffer) = audio_buffer {
                    let result_buffer =
                        raw_message_builder::<UdpTunnel>(&audio_buffer).unwrap_or_default();
                    if let Err(e) = audio_queue_ref.send(result_buffer) {
                        warn!("Failed to send audio data: {e}");
                    }
                }
            }
            microphone.stop().expect("Failed to stop microphone");
        }));
        Ok(())
    }

    pub fn stop(&mut self) {
        if self.playing.swap(false, Ordering::Relaxed) {
            trace!("Stopping audio thread");

            if let Some(thread) = self.audio_thread.take() {
                if let Err(e) = thread.join() {
                    error!("Failed to join audio thread: {:?}", e);
                }
            }
        }
    }
}

fn update_settings<T: VoiceActivationType>(
    settings_channel: &mut Receiver<GlobalSettings>,
    va: &mut Option<VoiceActivation<T>>,
    compressor: &mut Option<Compressor>,
    microphone: &Microphone,
    audio_settings: &mut Option<AudioPreviewContainer>,
) {
    match settings_channel.try_recv() {
        Ok(GlobalSettings::AudioInputSettings(audio_settings)) => {
            info!("Received settings: {:?}", audio_settings);
            update_voice_activation_options(&audio_settings, va);
            update_compressor_options(&audio_settings, compressor);

            let _ = microphone.volume_adjustment(audio_settings.amplification);
        }
        Ok(GlobalSettings::AudioPreview(audio_preview)) => {
            info!("Received audio preview: {:?}", audio_preview.enabled);
            if audio_preview.enabled {
                *audio_settings = Some(audio_preview);
            } else {
                *audio_settings = None;
            }
        }
        _ => {}
    }
}

// f32 to u64
#[allow(clippy::cast_possible_truncation)]
#[allow(clippy::cast_sign_loss)]
fn update_voice_activation_options<T: VoiceActivationType>(
    audio_settings: &AudioOptions,
    va: &mut Option<VoiceActivation<T>>,
) {
    if audio_settings.input_mode != InputMode::VoiceActivation {
        va.take();
        return;
    }

    if let Some(va) = va.as_mut() {
        if let Some(va_options) = &audio_settings.voice_activation_options {
            va.set_durations(
                Duration::from_millis(va_options.fade_out_duration as u64),
                Duration::from_millis(va_options.voice_hold as u64),
            );
            va.set_thresholds(
                T::from(va_options.voice_hysteresis_upper_threshold).unwrap_or_else(T::zero),
                T::from(va_options.voice_hysteresis_lower_threshold).unwrap_or_else(T::zero),
            );
        }
    };
}

fn update_compressor_options(audio_settings: &AudioOptions, compressor: &mut Option<Compressor>) {
    if let Some(compressor) = compressor.as_mut() {
        if let Some(compressor_options) = &audio_settings.compressor_options {
            compressor.set_attack(Duration::from_millis(compressor_options.attack_time as u64));
            compressor.set_release(Duration::from_millis(
                compressor_options.release_time as u64,
            ));
            compressor.set_threshold(compressor_options.threshold);
            compressor.set_ratio(compressor_options.ratio);
        }
    };
}

impl Drop for Recorder {
    fn drop(&mut self) {
        self.stop();
    }
}
