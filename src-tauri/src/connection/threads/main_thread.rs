use async_trait::async_trait;

use crate::connection::{Connection, BUFFER_SIZE};
use crate::errors::application_error::ApplicationError;
use crate::errors::AnyError;

use super::{ConnectionThread, MainThread, DEADMAN_INTERVAL};
use std::cmp;
use std::sync::atomic::Ordering;
use tokio::io::{AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;
use tokio::{select, time};
use tracing::{error, trace};

pub const MAX_SEND_SIZE: usize = 8192;

#[async_trait]
impl MainThread for Connection {
    async fn init_main_thread(
        &mut self,
        stream: Option<tokio_native_tls::TlsStream<TcpStream>>,
    ) -> AnyError<()> {
        if self.threads.get(&ConnectionThread::Main).is_some() {
            return Err(Box::new(ApplicationError::new(
                "MainThread already running",
            )));
        }

        let mut buffer = [0; BUFFER_SIZE];
        let (reader, mut writer) = tokio::io::split(stream.ok_or("No stream found")?);
        let mut reader = BufReader::new(reader);

        let tx_in = self.tx_in.clone();
        let mut rx_out = self.tx_out.subscribe();
        let running = self.running.clone();

        self.threads.insert(
            ConnectionThread::Main,
            tokio::spawn(async move {
                let mut interval = time::interval(DEADMAN_INTERVAL);

                while running.load(Ordering::Relaxed) {
                    select! {
                        Ok(size) = reader.read(&mut buffer) => {
                            if size == 0 {
                                return;
                            }
                            if let Err(e) = tx_in.send(buffer[0..size].to_vec()) {
                                error!("Error while channeling incomming data: {e:?}");
                            }
                        }
                        Ok(result) = rx_out.recv() => {
                            if result.len() < MAX_SEND_SIZE && result[1] != 0x01 {
                                trace!("Sending to server: {result:?}");
                            }

                            let chunks = result.chunks(cmp::max(1, result.len() / MAX_SEND_SIZE));

                            for chunk in chunks {
                                if let Err(e) = writer.write(chunk).await {
                                    error!("Error while writing to socket: {:?}", e);
                                    return;
                                }
                            }
                        }
                        _ = interval.tick() => {}
                    }
                }
            }),
        );

        Ok(())
    }
}
