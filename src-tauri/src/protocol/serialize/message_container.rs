use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct FrontendMessage<T: Clone> {
    pub message_type: String,
    pub data: T,
}

impl<T: Serialize + Clone> FrontendMessage<T> {
    pub fn new(message_type: &str, data: T) -> Self {
        Self {
            message_type: message_type.to_string(),
            data,
        }
    }
}
