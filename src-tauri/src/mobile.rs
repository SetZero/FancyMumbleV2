use tracing::Level;
use tracing_subscriber::{
    fmt::{self, format::FmtSpan},
    EnvFilter,
};

fn init_logging() {
    let format = fmt::format()
        .with_level(true)
        .with_target(false)
        .with_thread_ids(false)
        .with_thread_names(false)
        .compact(); // use the `Compact` formatting style.

    tracing_subscriber::fmt()
        .with_max_level(Level::TRACE)
        .event_format(format)
        .with_env_filter(EnvFilter::from_default_env().add_directive(Level::INFO.into()))
        .with_span_events(FmtSpan::CLOSE)
        .init();
}

#[tauri::mobile_entry_point]
fn main() {
    init_logging();
    super::AppBuilder::new().run();
}
