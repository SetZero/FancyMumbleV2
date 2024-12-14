import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import DOMPurify from 'dompurify';

export interface ServerSync {
    session?: number;
    max_bandwidth?: number;
    welcome_text?: string;
    permissions?: number;
}

export interface ServerState {
    connected: boolean;
    maxBandwidth: number;
    welcomeText: string;
    permissions: number;
}

interface ChannelDataUpdate {
  channel_id: number,
  data: any
}

const initialState: ServerState = {
    connected: false,
    maxBandwidth: 0,
    welcomeText: "",
    permissions: 0
};

export const serverSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    updateServerInfo: (state, action: PayloadAction<ServerSync>) => {
        const {  session, max_bandwidth, welcome_text, permissions } = action.payload;
        if (max_bandwidth !== undefined) {
            state.maxBandwidth = max_bandwidth;
        }
        if (welcome_text !== undefined) {
            state.welcomeText = DOMPurify.sanitize(welcome_text);
        }
        if (permissions !== undefined) {
            state.permissions = permissions;
        }
    },
  },
})

// Action creators are generated for each case reducer function
export const { updateServerInfo } = serverSlice.actions

export default serverSlice.reducer