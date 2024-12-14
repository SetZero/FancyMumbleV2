use std::error::Error;

use self::application_error::ApplicationError;

pub mod application_error;
pub mod certificate_error;
pub mod string_convertion;
pub mod voice_error;

pub type AnyError<T> = Result<T, Box<dyn Error>>;

pub fn to_error<T>(e: &str) -> Result<T, Box<dyn Error>> {
    Err(Box::new(ApplicationError::new(e)))
}
