import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import DOMPurify from 'dompurify';

export interface ChannelState {
  channel_id: number,
  comment: string,
  deaf: boolean,
  id: number
  mute: boolean,
  name: string,
  priority_speaker: boolean,
  profile_picture: string,
  recording: boolean,
  self_deaf: boolean,
  self_mute: boolean,
  suppress: boolean,
  channelImage: string,
}

interface ChannelDataUpdate {
  channel_id: number,
  data: any
}

const initialState: ChannelState[] = [];

export const channelSlice = createSlice({
  name: 'channel',
  initialState,
  reducers: {
    deleteChannel: (state, action: PayloadAction<number>) => {
      let channelId = action.payload;
      let channelIndex = state.findIndex(e => e.id === channelId);
      state.splice(channelIndex, 1);

    },
    updateChannel: (state, action: PayloadAction<ChannelState>) => {
      let channelId = action.payload.channel_id;
      let channelIndex = state.findIndex(e => e.channel_id === channelId);
      if (channelIndex !== -1) {
        state[channelIndex] = action.payload;
      } else {
        state.push(action.payload);
      }
    },

    updateChannelDescription: (state, action: PayloadAction<ChannelDataUpdate>) => {
      let channelId = action.payload.channel_id;
      let channelIndex = state.findIndex(e => e.channel_id === channelId);
      if (channelIndex !== -1) {
        state[channelIndex].comment = action.payload.data;
      }

      let cleanedDescription = DOMPurify.sanitize(action.payload.data);
      const parser = new DOMParser();
      let dom = parser.parseFromString(cleanedDescription, "text/html");

      let images = Array.from(dom.querySelectorAll('img'));
      // get last image
      if (action.payload.data && images.length > 0) {
        let lastImage = images[images.length - 1].src.replace(/ /g, '');
        state[channelIndex].channelImage = lastImage;
      }
    }
  },
})

// Action creators are generated for each case reducer function
export const { updateChannel, deleteChannel, updateChannelDescription } = channelSlice.actions

export default channelSlice.reducer