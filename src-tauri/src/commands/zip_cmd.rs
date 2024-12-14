use std::io::Write;

use base64::{engine::general_purpose, Engine};
use mime_guess::from_path;
use tokio::fs;
use tracing::trace;

#[tauri::command]
pub fn zip_data_to_utf8(data: &str, quality: u32) -> Result<String, String> {
    trace!("zipping data {:?}", data);

    let mut buffer = Vec::new();
    let lg_windows_size = 22;

    {
        let cursor = std::io::Cursor::new(&mut buffer);
        let mut writer = brotli::CompressorWriter::new(cursor, 4096, quality, lg_windows_size);
        writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        writer.flush().map_err(|e| e.to_string())?;
    }

    let encoded = general_purpose::STANDARD.encode(buffer);
    Ok(encoded)
}

#[tauri::command]
pub fn unzip_data_from_utf8(data: &str) -> Result<String, String> {
    let decoded_data = general_purpose::STANDARD
        .decode(data)
        .map_err(|e| e.to_string())?;
    let mut writer = brotli::DecompressorWriter::new(Vec::new(), 4096);
    writer.write_all(&decoded_data).map_err(|e| e.to_string())?;
    let output = writer.into_inner().map_err(|_| "Decompress Error")?;

    let result = String::from_utf8(output).map_err(|e| e.to_string())?;
    Ok(result)
}

#[tauri::command]
pub async fn convert_to_base64(path: &str) -> Result<String, String> {
    let content = fs::read(path).await.map_err(|e| e.to_string())?;
    let encoded = general_purpose::STANDARD.encode(content);
    let mime_type = from_path(path).first_or_octet_stream();

    Ok(format!("data:{mime_type};base64,{encoded}"))
}
