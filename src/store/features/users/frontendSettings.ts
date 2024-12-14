import { createSlice } from "@reduxjs/toolkit";
import { persistentStorage } from "../../persistance/persist";

export interface LinkPreviewSettings {
  enabled: boolean,
  allow_all: boolean,
  urls: string[]
}

export interface ApiKeys {
  tenor: string
}

export interface AdvancedSettings {
  disableAutoscroll: boolean;
  alwaysScrollDown: boolean;
  useWYSIWYG: boolean;
}

export interface LanguageSettings {
  language: string;
}

export interface UIState {
  show_sidebar: boolean;
}

export interface UserState {
  self_mute: boolean;
  self_deaf: boolean;
}

export interface FrontendSettings {
  api_keys?: ApiKeys;
  link_preview?: LinkPreviewSettings;
  advancedSettings?: AdvancedSettings
  language?: LanguageSettings;
  ui_state: UIState;
  user_state: UserState;
}

const defaultValues: FrontendSettings = {
  link_preview: {
    enabled: true,
    allow_all: false,
    urls: []
  },
  api_keys: {
    tenor: ''
  },
  advancedSettings: {
    disableAutoscroll: false,
    alwaysScrollDown: false,
    useWYSIWYG: false
  },
  ui_state: {
    show_sidebar: false
  },
  user_state: {
    self_mute: true,
    self_deaf: true
  }
};
const initialState: FrontendSettings = defaultValues;

export const frontendSettings = createSlice({
  name: 'channel',
  initialState,
  reducers: {
    updateLinkPreview: (state, action) => {
      state.link_preview = action.payload;
      console.log("updateLinkPreview: ", action.payload)
    },
    updateApiKey: (state, action) => {
      state.api_keys = action.payload;
    },
    updateFrontendSettings: (state, action) => {
      Object.assign(state, action.payload);
    },
    updateAdvancedSettings: (state, action) => {
      console.log("updateAdvancedSettings: ", action.payload);
      state.advancedSettings = action.payload;
    },
    updateUIState: (state, action) => {
      state.ui_state = action.payload;
    },
    updateUserState: (state, action) => {
      state.user_state = action.payload;
    },
    clearFrontendSettings: (state) => {
      Object.assign(state, {});
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    }
  },
})

export const {
  updateFrontendSettings,
  updateLinkPreview,
  updateApiKey,
  updateAdvancedSettings,
  clearFrontendSettings,
  setLanguage,
  updateUIState,
  updateUserState
} = frontendSettings.actions;

export default frontendSettings.reducer