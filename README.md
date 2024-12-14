# Fancy Mumble V2
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FFancy-Mumble%2FFancyMumbleV2.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FFancy-Mumble%2FFancyMumbleV2?ref=badge_shield)


Fancy Mumble is a Mumble client which focuses on additional features for [Mumble](https://github.com/mumble-voip/mumble).
The main goal of this project is to improve the user experience while staying backward compatible with the original Mumble Server.

## Features
Currently, Fancy Mumble is under development and a lot of actual features of the original Mumble client are missing
* [x] Send Gif from a quick select menu
* [x] Link previews with additional privacy options
* [ ] Reactions
* [ ] Share any File

## How to use

To build you need to have a [`protoc compiler`](https://github.com/protocolbuffers/protobuf) installed on your system. Please follow the installation instructions [here](https://github.com/protocolbuffers/protobuf#protocol-compiler-installation).

You also need to install tauri. Follow the installation instructions [here](https://tauri.app/v1/guides/getting-started/setup).

When you have `protoc` and tauri installed you can start building your app according to [this page](https://tauri.app/v1/guides/development/development-cycle).

**TL;DR (Ubuntu)**:
```bash
apt install -y protobuf-compiler
cargo install create-tauri-app
cargo tauri dev
```

## Screenshots

![](.github/images/Screenshot%202024-02-18%20213652.png)
![](.github/images/Screenshot%202024-02-18%20214742.png)

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FFancy-Mumble%2FFancyMumbleV2.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FFancy-Mumble%2FFancyMumbleV2?ref=badge_large)