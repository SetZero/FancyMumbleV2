use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

#[allow(clippy::module_name_repetitions)]
#[derive(serde::Deserialize, Serialize, Debug)]
pub enum FrontendSettings {
    LinkPreview(LinkPreview),
    ApiKeys(ApiKeys),
    AudioInput(AudioOptions),
}

#[derive(Deserialize, Serialize, Debug)]
pub struct LinkPreview {
    enabled: Option<bool>,
    allow_all: Option<bool>,
    urls: Option<Vec<String>>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ApiKeys {
    tenor: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct VoiceActivationOptions {
    pub voice_hold: f32,
    pub fade_out_duration: usize,
    pub voice_hysteresis_lower_threshold: f32,
    pub voice_hysteresis_upper_threshold: f32,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CompressorOptions {
    pub attack_time: usize,
    pub release_time: usize,
    pub threshold: f32,
    pub ratio: f32,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize)]
pub enum InputMode {
    VoiceActivation = 0,
    PushToTalk = 1,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AudioOptions {
    pub amplification: f32,
    pub input_mode: InputMode,
    pub voice_activation_options: Option<VoiceActivationOptions>,
    pub compressor_options: Option<CompressorOptions>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UserVoiceAdjustment {
    pub volume: f32,
    pub user_id: u32,
}

#[allow(clippy::module_name_repetitions)]
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AudioOutputSettings {
    pub voice_adjustment: Vec<UserVoiceAdjustment>,
}

#[derive(Clone, Debug)]
pub struct AudioPreviewContainer {
    pub enabled: bool,
    pub window: Arc<Mutex<tauri::WebviewWindow>>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AudioUserState {
    pub deaf: bool,
    pub mute: bool,
}

#[allow(clippy::module_name_repetitions)]
#[allow(clippy::enum_variant_names)]
#[derive(Clone, Debug)]
pub enum GlobalSettings {
    AudioInputSettings(AudioOptions),
    AudioOutputSettings(AudioOutputSettings),
    AudioPreview(AudioPreviewContainer),
    AudioUserState(AudioUserState),
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Coordinates {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}
