import { platform } from '@tauri-apps/plugin-os';

export async function isMobile(): Promise<boolean> {
    const os = await platform();
    return os == "android" || os == "ios";
}

export async function getPlatform(): Promise<string> {
    return await platform();
}