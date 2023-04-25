pub mod user_manager;

trait Update<New> {
    fn update_if_some<T>(original: &mut T, other: Option<T>) {
        if let Some(id) = other {
            *original = id;
        }
    }

    fn update_from(&mut self, new_state: New) -> &Self;
}