use std::{
    collections::{btree_map::Entry, BTreeMap},
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc::{self, Receiver, SyncSender},
        Arc,
    },
    thread,
    time::Duration,
};

use rodio::{OutputStreamHandle, Sink};
use tokio::sync::broadcast;
use tracing::{error, trace};

use crate::{commands::utils::settings::GlobalSettings, errors::AnyError};

use super::decoder::DecodedMessage;

pub struct Player {
    audio_thread: Option<thread::JoinHandle<()>>,
    queue_rx: Option<Receiver<DecodedMessage>>,
    queue_tx: SyncSender<DecodedMessage>,
    playing: Arc<AtomicBool>,
    settings_channel: Option<broadcast::Receiver<GlobalSettings>>,
}

impl Player {
    pub fn new(settings_channel: broadcast::Receiver<GlobalSettings>) -> Self {
        let (tx, rx) = mpsc::sync_channel(4);

        Self {
            audio_thread: None,
            queue_rx: Some(rx),
            queue_tx: tx,
            playing: Arc::new(AtomicBool::new(false)),
            settings_channel: Some(settings_channel),
        }
    }

    pub fn start(&mut self) -> AnyError<()> {
        if self.playing.swap(true, Ordering::Relaxed) || self.audio_thread.is_some() {
            return Err("Audio thread already started".into());
        }

        let audio_queue_ref = self.queue_rx.take().ok_or("failed to get audio queue")?;
        let playing_clone = self.playing.clone();

        let mut settings_channel = self
            .settings_channel
            .take()
            .ok_or("failed to get settings channel")?;
        self.audio_thread = Some(thread::spawn(move || {
            trace!("Starting audio thread");

            let (_stream, handle) = match rodio::OutputStream::try_default() {
                Ok(s) => s,
                Err(e) => {
                    error!("Failed to create audio stream: {}", e);
                    return;
                }
            };

            let mut user_audio_info_map = UserAudioInfoMap::new(handle);

            while playing_clone.load(Ordering::Relaxed) {
                Self::update_settings(&mut settings_channel, &mut user_audio_info_map);
                if let Ok(mut queue_value) =
                    audio_queue_ref.recv_timeout(Duration::from_millis(100))
                {
                    if let Ok(user_info) = user_audio_info_map.get_audio_info(queue_value.user_id) {
                        Self::adjust_volume_vec(&mut queue_value.data, user_info.volume_adjustment);

                        user_info
                            .sink
                            .append(rodio::buffer::SamplesBuffer::<i16>::new(
                                1,
                                48000,
                                queue_value.data,
                            ));
                    }
                }
            }
        }));

        Ok(())
    }

    pub fn add_to_queue(&mut self, data: DecodedMessage) -> AnyError<()> {
        if self.playing.load(Ordering::Relaxed) {
            //todo add user id to audio data
            self.queue_tx.try_send(data)?;
        }

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

    fn update_settings(
        settings_channel: &mut broadcast::Receiver<GlobalSettings>,
        audio_map: &mut UserAudioInfoMap,
    ) {
        if let Ok(GlobalSettings::AudioOutputSettings(audio_settings)) = settings_channel.try_recv()
        {
            trace!("Received settings: {:?}", audio_settings);
            for user_info in audio_settings.voice_adjustment {
                audio_map.update_user_volume_adjustment(user_info.user_id, user_info.volume);
            }
        }
    }

    // we need the cast from f32 to i16
    #[allow(clippy::cast_possible_truncation)]
    #[allow(clippy::cast_lossless)]
    fn adjust_volume_vec(audio_data: &mut [i16], volume_adjustment: f32) {
        if (volume_adjustment - 1.0).abs() < std::f32::EPSILON {
            return;
        }

        let linear_adjustment = 10f32.powf(volume_adjustment / 20.0);
        for sample in audio_data.iter_mut() {
            *sample = (*sample as f32 * linear_adjustment).round() as i16;
        }
    }
}

impl Drop for Player {
    fn drop(&mut self) {
        self.stop();
    }
}

struct UserAudioInfo {
    sink: Sink,
    volume_adjustment: f32,
}

struct UserAudioInfoMap {
    handle: OutputStreamHandle,
    sink_map: BTreeMap<u32, UserAudioInfo>,
}

impl UserAudioInfoMap {
    fn new(handle: OutputStreamHandle) -> Self {
        Self {
            handle,
            sink_map: BTreeMap::new(),
        }
    }

    fn get_audio_info(&mut self, user_id: u32) -> Result<&UserAudioInfo, String> {
        let result = match self.sink_map.entry(user_id) {
            Entry::Occupied(entry) => entry.into_mut(),
            Entry::Vacant(entry) => entry.insert(UserAudioInfo {
                sink: Self::create_sink(&self.handle)?,
                volume_adjustment: 1.0,
            }),
        };

        Ok(result)
    }

    fn update_user_volume_adjustment(&mut self, user_id: u32, volume_adjustment: f32) {
        if let Some(user_info) = self.sink_map.get_mut(&user_id) {
            user_info.volume_adjustment = volume_adjustment;
        }
    }

    fn create_sink(handle: &OutputStreamHandle) -> Result<Sink, String> {
        match rodio::Sink::try_new(handle) {
            Ok(s) => Ok(s),
            Err(e) => Err(format!("Failed to create sink: {e}")),
        }
    }
}
