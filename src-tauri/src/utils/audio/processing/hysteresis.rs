pub struct Hysteresis<T> {
    threshold_low: T,
    threshold_high: T,
    state: bool,
}

impl<T: PartialOrd> Hysteresis<T> {
    pub const fn new(threshold_low: T, threshold_high: T) -> Self {
        Self {
            threshold_low,
            threshold_high,
            state: false,
        }
    }

    pub fn update(&mut self, value: &T) -> bool {
        if value > &self.threshold_high {
            self.state = true;
        } else if value < &self.threshold_low {
            self.state = false;
        }
        self.state
    }
}
