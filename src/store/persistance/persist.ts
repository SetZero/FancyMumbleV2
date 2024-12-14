import { Store } from "tauri-plugin-store-api";
import { FrontendSettings } from "../features/users/frontendSettings";
import { AudioInputSettings } from "../features/users/audioSettings";

export const persistentStorage = new Store(".settings.dat");

export async function persistFrontendSettings(frontendSettings: FrontendSettings) {
    await persistentStorage.set('frontendSettings', { ...frontendSettings });
    await persistentStorage.save();
}

export async function persistAudioSettings(audioSettins: AudioInputSettings) {
    console.log("Persisting audio settings: ", audioSettins);
    await persistentStorage.set('audioSettings', { ...audioSettins });
    await persistentStorage.save();
}