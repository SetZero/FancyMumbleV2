// special thanks to https://github.com/rust-lang/rust-analyzer/tree/master for this idea
// from: https://github.com/rust-lang/rust-analyzer/blob/db41e6b40892b89ebb7184ceda8e94896bf8d37f/crates/rust-analyzer/tests/slow-tests/tidy.rs
use std::path::PathBuf;

use xshell::{cmd, Shell};

pub fn project_root() -> PathBuf {
    let dir = env!("CARGO_MANIFEST_DIR");

    PathBuf::from(dir)
}

#[test]
fn check_code_formatting() {
    let sh = &Shell::new().expect("Failed to create shell");
    sh.change_dir(project_root());

    let out = cmd!(sh, "rustup run stable rustfmt --version")
        .read()
        .expect("Failed to run `rustfmt --version`");
    assert!(
        out.contains("stable"),
        "Failed to run rustfmt from toolchain 'stable'. \
                 Please run `rustup component add rustfmt --toolchain stable` to install it."
    );

    let res = cmd!(sh, "rustup run stable cargo fmt -- --check").run();
    if res.is_err() {
        cmd!(sh, "rustup run stable cargo fmt")
            .run()
            .expect("Failed to run `cargo fmt`");
    }
    res.expect("Failed to run `cargo fmt`");
}

#[cfg(not(feature = "in-rust-tree"))]
#[test]
fn check_licenses() {
    let sh = &Shell::new().expect("Failed to create shell");

    let mut expected = "
(MIT OR Apache-2.0) AND Unicode-DFS-2016
(Apache-2.0 OR MIT) AND BSD-3-Clause
0BSD OR MIT OR Apache-2.0
Apache-2.0
Apache-2.0 OR BSL-1.0
Apache-2.0 OR ISC OR MIT
Apache-2.0 OR MIT
Apache-2.0 / MIT
Apache-2.0 WITH LLVM-exception
Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT
Apache-2.0/MIT
BSD-3-Clause
BSD-2-Clause OR Apache-2.0 OR MIT
BSD-2-Clause OR MIT OR Apache-2.0
BSD-3-Clause OR MIT OR Apache-2.0
BSD-3-Clause/MIT
CC0-1.0 OR MIT-0
CC0-1.0 OR MIT-0 OR Apache-2.0
ISC
MIT
MIT / Apache-2.0
MIT OR Apache-2.0
MIT OR Apache-2.0 OR Zlib
MIT OR Zlib OR Apache-2.0
MIT/Apache-2.0
MPL-2.0
Unlicense OR MIT
Unlicense/MIT
Zlib OR Apache-2.0 OR MIT
Zlib
null"
        .lines()
        .filter(|it| !it.is_empty())
        .collect::<Vec<_>>();
    expected.sort_unstable();

    let meta = cmd!(sh, "cargo metadata --format-version 1")
        .read()
        .expect("Failed to run `cargo metadata`");
    let mut licenses = meta
        .split(|c| c == ',' || c == '{' || c == '}')
        .filter(|it| it.contains(r#""license""#))
        .map(str::trim)
        .map(|it| it[r#""license":"#.len()..].trim_matches('"'))
        .collect::<Vec<_>>();
    licenses.sort_unstable();
    licenses.dedup();

    let new = licenses
        .iter()
        .filter(|it| !expected.contains(it))
        .collect::<Vec<_>>();

    if !new.is_empty() {
        let mut diff = String::new();

        diff.push_str("New Licenses:\n");
        for &l in &licenses {
            if !expected.contains(&l) {
                diff += &format!("  {l}\n");
            }
        }

        panic!("different set of licenses!\n{diff}");
    }
    assert!(new.is_empty());
}
