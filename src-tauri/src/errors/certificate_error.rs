use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub struct CertificateError {
    details: String,
}

impl CertificateError {
    pub fn new(msg: &str) -> Self {
        Self {
            details: msg.to_string(),
        }
    }
}

impl fmt::Display for CertificateError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.details)
    }
}

impl Error for CertificateError {
    fn description(&self) -> &str {
        &self.details
    }
}
