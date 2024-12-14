use std::{ops::MulAssign, time::Duration};

use num_traits::{NumCast, Signed};

use crate::utils::audio::processing::hysteresis::Hysteresis;

#[allow(clippy::module_name_repetitions)] // yes
pub trait VoiceActivationType:
    Signed + Copy + Default + PartialOrd + MulAssign + NumCast + core::fmt::Debug
{
}
impl<T: Signed + Copy + Default + PartialOrd + MulAssign + NumCast + core::fmt::Debug>
    VoiceActivationType for T
{
}

#[allow(clippy::struct_field_names)]
pub struct VoiceActivation<T: VoiceActivationType> {
    upper_threshold: T,
    lower_threshold: T,
    fade_samples: usize,
    fade_out_count: usize,
    fade_in_count: usize,
    voice_activation_hold_offset: f32,
    sample_rate: usize,
}

impl<T: VoiceActivationType> VoiceActivation<T> {
    // fade_out samples are only whole values
    #[allow(clippy::cast_precision_loss)]
    #[allow(clippy::cast_possible_truncation)]
    #[allow(clippy::cast_sign_loss)]
    pub fn new(
        sample_rate: usize,
        fadeout_duration: Duration,
        voice_activation_hold: Duration,
        upper_threshold: T,
        lower_threshold: T,
    ) -> Self {
        let (voice_activation_hold_offset, fade_out_samples) =
            Self::calculate_voice_activation_hold_offset(
                fadeout_duration,
                voice_activation_hold,
                sample_rate,
            );

        Self {
            upper_threshold,
            lower_threshold,
            fade_samples: fade_out_samples,
            fade_out_count: 0,
            fade_in_count: 0,
            voice_activation_hold_offset,
            sample_rate,
        }
    }

    // truncation is needed
    #[allow(clippy::cast_possible_truncation)]
    #[allow(clippy::cast_sign_loss)]
    #[allow(clippy::cast_precision_loss)]
    fn calculate_voice_activation_hold_offset(
        fadeout_duration: Duration,
        voice_activation_hold: Duration,
        sample_rate: usize,
    ) -> (f32, usize) {
        let total_duration = voice_activation_hold + fadeout_duration;
        let fade_out_samples: usize = (total_duration.as_secs_f32() * sample_rate as f32) as usize; // Number of samples for fading out the signal
        let voice_hold_samples: usize =
            (voice_activation_hold.as_secs_f32() * sample_rate as f32) as usize;
        (
            voice_hold_samples as f32 / fade_out_samples as f32,
            fade_out_samples,
        )
    }

    pub fn set_thresholds(&mut self, upper_threshold: T, lower_threshold: T) {
        self.upper_threshold = upper_threshold;
        self.lower_threshold = lower_threshold;
    }

    pub fn set_durations(&mut self, fadeout_duration: Duration, voice_activation_hold: Duration) {
        let (voice_activation_hold_offset, fade_out_samples) =
            Self::calculate_voice_activation_hold_offset(
                fadeout_duration,
                voice_activation_hold,
                self.sample_rate,
            );
        self.voice_activation_hold_offset = voice_activation_hold_offset;
        self.fade_samples = fade_out_samples;
    }

    pub fn process(&mut self, new_data: &mut [T]) -> T {
        const FRAME_SIZE: usize = 160; // Size of each frame in samples
        let mut max_amplitude: T = T::zero();

        let mut vad = Hysteresis::new(self.lower_threshold, self.upper_threshold); // Hysteresis object for the VAD logic

        // Process the input data frame by frame
        for frame in new_data.chunks_mut(FRAME_SIZE) {
            // Calculate the amplitude of the frame
            let amplitude = frame
                .iter()
                .map(Signed::abs)
                .fold(None, |max, x| {
                    max.map_or(Some(x), |max| Some(if x > max { x } else { max }))
                })
                .unwrap_or_else(T::zero); // Apply the VAD logic

            max_amplitude = if amplitude > max_amplitude {
                amplitude
            } else {
                max_amplitude
            };

            if vad.update(&amplitude) {
                // If the VAD is on, reset the fade out counter
                self.fade_out_count = 0;
            } else if self.fade_out_count < self.fade_samples {
                self.fade_in_count = 0;
                // If the VAD is off, increment the fade out counter
                self.fade_out_count += FRAME_SIZE;
                if self.fade_out_count > self.fade_samples {
                    // If the fade out counter exceeds the fade out samples, clamp it
                    self.fade_out_count = self.fade_samples;
                } // Apply the fade out function to the frame
                let fade_out_factor = self.calculate_fadeout(); // Calculate the fade out factor
                for x in frame.iter_mut() {
                    // Multiply each sample by the fade out factor
                    *x *= fade_out_factor;
                }
            } else {
                frame.fill(T::zero());
            }
        }

        max_amplitude
    }

    // precision-loss is intended
    #[allow(clippy::cast_precision_loss)]
    fn calculate_fadeout(&self) -> T {
        let voice_activation_hold_offset = self.voice_activation_hold_offset;
        let inverse_offset = 1.0 - voice_activation_hold_offset;

        let ratio = self.fade_out_count as f32 / self.fade_samples as f32;
        let adjusted_ratio = (ratio - voice_activation_hold_offset) * (1.0 / inverse_offset);
        let fade_out_factor = 1.0 - (adjusted_ratio.max(0.0).ln_1p() * inverse_offset).min(1.0);

        T::from(fade_out_factor).unwrap_or_else(T::zero)
    }
}
