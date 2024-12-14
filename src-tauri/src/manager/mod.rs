use std::mem;

pub mod channel;
pub mod connection_state;
pub mod text_message;
pub mod user;
pub mod voice;

trait Update<New> {
    fn update_if_some<T: Default>(original: &mut T, other: &mut Option<T>) {
        if let Some(id) = other {
            *original = mem::take(id);
        }
    }

    fn update_from(&mut self, new_state: &mut New) -> &Self;
}
