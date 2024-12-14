use crate::{
    connection::{threads::MAX_PING_FAILURES, Connection, PingThread},
    mumble,
    protocol::serialize::message_container::FrontendMessage,
    utils::{frontend::send_to_frontend, messages::message_builder},
};
use std::{
    sync::atomic::Ordering,
    time::{Duration, SystemTime},
};
use tokio::{select, time};
use tracing::error;

use super::{ConnectionThread, DEADMAN_INTERVAL};

const PING_INTERVAL: Duration = Duration::from_millis(5000);

impl PingThread for Connection {
    fn spawn_ping_thread(&mut self) {
        if self.threads.get(&ConnectionThread::Ping).is_some() {
            error!("PingThread already running");
            return;
        }

        let tx_out = self.tx_out.clone();
        let running = self.running.clone();
        let frontend_channel = self.message_channels.message_channel.clone();

        // timer thread
        self.threads.insert(
            ConnectionThread::Ping,
            tokio::spawn(async move {
                let mut interval = time::interval(PING_INTERVAL);
                let mut deadman_switch = time::interval(DEADMAN_INTERVAL);
                let mut deadman_counter = 0;

                while running.load(Ordering::Relaxed) {
                    let now = match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
                        Ok(duration) => duration.as_secs(),
                        Err(error) => {
                            error!("Unable to get timestamp for Ping: {}", error);
                            continue;
                        }
                    };

                    //todo: Add actual ping statistics
                    let ping = mumble::proto::Ping {
                        timestamp: Some(now),
                        good: Some(0),
                        late: Some(0),
                        lost: Some(999),
                        resync: Some(0),
                        tcp_packets: Some(1),
                        tcp_ping_avg: Some(1.2f32),
                        tcp_ping_var: Some(2.0f32),
                        udp_packets: Some(1),
                        udp_ping_avg: Some(2.3f32),
                        udp_ping_var: Some(5.6f32),
                    };

                    select! {
                        _ = deadman_switch.tick() => {}
                        _ = interval.tick() => {
                            match tx_out.send(message_builder(&ping).unwrap_or_default()) {
                                Ok(_) => { deadman_counter = 0; }
                                Err(error) => {
                                    error!("Unable to send Ping: {}", error);
                                    deadman_counter += 1;
                                    if deadman_counter > MAX_PING_FAILURES {
                                        let message = FrontendMessage::new("ping_timeout", "Timeout while sending Ping");
                                        send_to_frontend(&frontend_channel, &message);
                                    }
                                },
                            }
                        }
                    }
                }
            }),
        );
    }
}
