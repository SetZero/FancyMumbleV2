import { createSlice } from "@reduxjs/toolkit";
import { persistentStorage } from "../../persistance/persist";

export enum InputMode {
    VoiceActivation = 0,
    PushToTalk = 1,
}

interface VoiceActivationOptions {
    voice_hold: number;
    fade_out_duration: number;
    voice_hysteresis_lower_threshold: number;
    voice_hysteresis_upper_threshold: number;
}

interface CompressorOptions {
    attack_time: number,
    release_time: number,
    threshold: number,
    ratio: number,
}

export interface AudioInputSettings {
    amplification: number;
    input_mode: InputMode;
    voice_activation_options: VoiceActivationOptions;
    compressor_options: CompressorOptions;
}

const defaultValues: AudioInputSettings = {
    amplification: 13.0,
    input_mode: InputMode.VoiceActivation,
    voice_activation_options: {
        voice_hold: 66.0,
        fade_out_duration: 850,
        voice_hysteresis_lower_threshold: 0.03,
        voice_hysteresis_upper_threshold: 0.07
    },
    compressor_options: {
        attack_time: 0.1,
        release_time: 0.1,
        threshold: -30.0,
        ratio: 10.0
    }
};

const initialState: AudioInputSettings = defaultValues;

export const frontendSettings = createSlice({
    name: 'channel',
    initialState,
    reducers: {
        updateAudioSettings: (state, action) => {
            Object.assign(state, action.payload);
        },
        setAmplification: (state, action) => {
            state.amplification = action.payload;
        },
        setInputMode: (state, action) => {
            state.input_mode = action.payload;
        },
        setVoiceHold(state, action) {
            state.voice_activation_options.voice_hold = action.payload;
        },
        setFadeOutDuration(state, action) {
            state.voice_activation_options.fade_out_duration = action.payload;
        },
        setVoiceHysteresis(state, action) {
            state.voice_activation_options.voice_hysteresis_lower_threshold = action.payload[0];
            state.voice_activation_options.voice_hysteresis_upper_threshold = action.payload[1];
        },
        setAttackTime(state, action) {
            state.compressor_options.attack_time = action.payload
        },
        setReleaseTime(state, action) {
            state.compressor_options.release_time = action.payload
        },
        setCompressorThreshold(state, action) {
            state.compressor_options.threshold = action.payload
        },
        setCompressorRatio(state, action) {
            state.compressor_options.ratio = action.payload
        },
    },
})

export const {
    updateAudioSettings,
    setAmplification,
    setInputMode,
    setVoiceHold,
    setFadeOutDuration,
    setVoiceHysteresis,
    setAttackTime,
    setReleaseTime,
    setCompressorThreshold,
    setCompressorRatio
} = frontendSettings.actions

export default frontendSettings.reducer