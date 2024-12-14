use std::time::Duration;
pub struct Compressor {
    sample_rate: usize,
    threshold: f32,
    ratio: f32,
    attack: Duration,
    release: Duration,
}

impl Compressor {
    pub const fn new(
        sample_rate: usize,
        threshold: f32,
        ratio: f32,
        attack: Duration,
        release: Duration,
    ) -> Self {
        Self {
            sample_rate,
            threshold,
            ratio,
            attack,
            release,
        }
    }

    #[allow(clippy::cast_precision_loss)] // loss is expected due to resampling
    pub fn process(&self, input: &mut [f32]) {
        let attack_samples = self.attack.as_secs_f32() * self.sample_rate as f32;
        let release_samples = self.release.as_secs_f32() * self.sample_rate as f32;

        for sample in input.iter_mut() {
            let abs_sample = sample.abs();
            let sign = sample.signum();

            if abs_sample > self.threshold {
                let db_above_threshold = 20.0 * (abs_sample / self.threshold).log10();
                let gain_reduction_db = (db_above_threshold - self.threshold) / self.ratio;
                let gain_reduction_linear = 10.0f32.powf(gain_reduction_db / 20.0);

                // Apply attack and release time
                if gain_reduction_linear < abs_sample {
                    *sample =
                        sign * (abs_sample - (abs_sample - gain_reduction_linear) / attack_samples);
                } else {
                    *sample = sign
                        * (abs_sample - (abs_sample - gain_reduction_linear) / release_samples);
                }
            };
        }
    }

    pub fn set_threshold(&mut self, threshold: f32) {
        self.threshold = threshold;
    }

    pub fn set_ratio(&mut self, ratio: f32) {
        self.ratio = ratio;
    }

    pub fn set_attack(&mut self, attack: Duration) {
        self.attack = attack;
    }

    pub fn set_release(&mut self, release: Duration) {
        self.release = release;
    }
}
