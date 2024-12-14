use patch::{Line, Patch};
use reqwest::Client;
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self, Write};
use std::path::Path;
use std::{env, str};
use tokio::runtime::Runtime;

const DOWNLOAD_MUMBLE_PROTO_DIR: &str =
    "https://raw.githubusercontent.com/mumble-voip/mumble/82bcd1eb3d53aa9bfc1f6ff539961b0c29336266/src/Mumble.proto";
const MUMBLE_PROTO_SHA256: &str =
    "0f86d85938ff2268e3eb05ce0120805fb049ad0d062f4d01c6657b048dcc9245";
const PATCHED_MUMBLE_PROTO_HASH: &str =
    "ebadea7bcb720da05149076b1b0ec7a9ff1107a5107a4137b75e8e45fb52f68d";
const DOWNLOAD_MUMBLE_UDP_PROTO_DIR: &str =
    "https://raw.githubusercontent.com/mumble-voip/mumble/6a48c0478477054b4e7356b0bd7dc9da24cf0880/src/MumbleUDP.proto";
const MUMBLE_UDP_PROTO_SHA256: &str =
    "8087983b0d9a12e11380cad99870a0ef3cee7550b13a114a733aa835acd3d040";

fn apply(diff: Patch, old: &str) -> String {
    let old_lines = old.lines().collect::<Vec<&str>>();
    let mut out: Vec<&str> = vec![];
    let mut old_line = 0;
    for hunk in diff.hunks {
        while old_line < hunk.old_range.start - 1 {
            out.push(old_lines[usize::try_from(old_line).expect("usize::try_from failed")]);
            old_line += 1;
        }
        old_line += hunk.old_range.count;
        for line in hunk.lines {
            match line {
                Line::Add(s) | Line::Context(s) => out.push(s),
                Line::Remove(_) => {}
            }
        }
    }
    while old_line < old_lines.len() as u64 {
        out.push(old_lines[usize::try_from(old_line).expect("usize::try_from failed")]);
        old_line += 1;
    }
    out.push(""); // add a newline at the end
    out.join("\n")
}

fn get_data_hash_str(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    let file_hash = hasher.finalize();

    format!("{file_hash:x}")
}

fn read_file_as_bytes(file_path: &Path) -> Result<String, Box<dyn std::error::Error>> {
    fs::read_to_string(file_path).map_err(std::convert::Into::into)
}

fn write_to_file(data: &[u8], file_path: &Path) {
    let mut file = File::create(file_path).expect("Failed to create file");
    file.write_all(data).expect("Failed to write file");
}

async fn download_file(
    url: &str,
    sha256: &str,
    file_path: &Path,
) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let client = Client::new();

    let response = client.get(url).send().await?.text().await?;
    let response_bytes = response.as_bytes();

    let file_hash = get_data_hash_str(response_bytes);
    if file_hash != sha256 {
        return Err(format!(
            "File hash does not match expected hash: {file_hash}, actual hash: {sha256}"
        )
        .into());
    }

    write_to_file(response_bytes, file_path);

    Ok(response_bytes.to_vec())
}

fn main() -> io::Result<()> {
    let mumble_proto = Path::new("../out/proto/Mumble.proto");
    let mumble_udp_proto = Path::new("../out/proto/MumbleUDP.proto");
    let fancy_proto = Path::new("src/proto/Fancy.proto");
    let patch_file = Path::new("src/proto/Mumble.proto.patch");

    let mumble_proto_bytes = read_file_as_bytes(mumble_proto).unwrap_or_default();
    let hash = get_data_hash_str(mumble_proto_bytes.as_bytes());

    // download Mumble proto and patch it
    if hash != PATCHED_MUMBLE_PROTO_HASH {
        let rt = Runtime::new()?;
        rt.block_on(async {
            let response_file =
                download_file(DOWNLOAD_MUMBLE_PROTO_DIR, MUMBLE_PROTO_SHA256, mumble_proto)
                    .await
                    .expect("Failed to download Mumble.proto");
            let response_str = str::from_utf8(&response_file).expect("Failed to parse response");

            let patch_output = read_file_as_bytes(patch_file).expect("Failed to read file");
            let patch = Patch::from_single(patch_output.as_str()).expect("Failed to parse patch");
            let new_content = apply(patch, response_str);
            write_to_file(new_content.as_bytes(), mumble_proto);

            download_file(
                DOWNLOAD_MUMBLE_UDP_PROTO_DIR,
                MUMBLE_UDP_PROTO_SHA256,
                mumble_udp_proto,
            )
            .await
            .expect("Failed to download MumbleUDP.proto");
        });
    }

    let mumble_proto_str = mumble_proto
        .to_str()
        .expect("Failed to convert path to string");
    let mumble_udp_proto_str = mumble_udp_proto
        .to_str()
        .expect("Failed to convert path to string");
    let fancy_proto_str = fancy_proto
        .to_str()
        .expect("Failed to convert path to string");

    prost_build::compile_protos(&[mumble_proto_str], &["../out"])?;
    prost_build::compile_protos(&[mumble_udp_proto_str], &["../out"])?;
    prost_build::compile_protos(&[fancy_proto_str], &["src/"])?;
    tauri_build::build();

    Ok(())
}
