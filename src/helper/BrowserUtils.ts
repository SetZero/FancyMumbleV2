import { invoke } from "@tauri-apps/api/core";

export function openInBrowser(url: string) {
    invoke('open_browser', { url: url });
}