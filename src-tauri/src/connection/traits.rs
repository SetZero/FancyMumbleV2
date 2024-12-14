use async_trait::async_trait;

use crate::errors::AnyError;

#[async_trait]
pub trait Shutdown {
    async fn shutdown(&mut self) -> AnyError<()>;
}

#[async_trait]
pub trait HandleMessage {}
