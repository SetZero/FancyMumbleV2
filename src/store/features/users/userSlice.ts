import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { parseUserCommentForData } from '../../../helper/ProfileDataHelper'
import { AsyncThunkFulfilledActionCreator } from '@reduxjs/toolkit/dist/createAsyncThunk';

type DataUpdateAction<T> = AsyncThunkFulfilledActionCreator<T, void, any>;

export interface UserCommentSettings {
  primary_color?: string,
  accent_color?: string,
}
export interface UserCommentData {
  comment: string,
  background_picture: string,
  settings: UserCommentSettings
}
export interface UpdateableUserState {
  id?: number
  channel_id?: number,
  comment?: string,
  deaf?: boolean,
  mute?: boolean,
  name?: string,
  priority_speaker?: boolean,
  profile_picture?: string,
  recording?: boolean,
  self_deaf?: boolean,
  self_mute?: boolean,
  suppress?: boolean,
}
export interface UsersState {
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
  talking: boolean,
  mutedSince: number | undefined,
  deafenedSince: number | undefined,
  joinedSince: number | undefined,
  commentData: UserCommentData
}

interface UserDataUpdate {
  user_id: number,
  data: any
}

export interface UserInfoState {
  currentUser: UsersState | undefined,
  users: UsersState[],
  connected: boolean,
}

const initialState: UserInfoState = {
  currentUser: undefined,
  users: [],
  connected: false,
};

export function defaultInitializeUser(): UsersState {
  return {
    channel_id: 0,
    comment: "",
    deaf: false,
    id: 0,
    mute: false,
    name: "",
    priority_speaker: false,
    profile_picture: "",
    recording: false,
    self_deaf: false,
    self_mute: false,
    suppress: false,
    talking: false,
    mutedSince: undefined,
    deafenedSince: undefined,
    joinedSince: undefined,
    commentData: {
      comment: "",
      background_picture: "",
      settings: {}
    }
  }
}

function updateUserData(state: UsersState[], user_info: UserDataUpdate, field: string): UsersState {
  let prevList = state;
  const userIndex = prevList.findIndex(e => e.id === user_info.user_id);
  if (userIndex !== -1) {
    // @ts-ignore (field is one of the above types, but TS doesn't like this)
    state[userIndex][field] = user_info.data;
  }

  return state[userIndex];
}

export const updateUserComment = createAsyncThunk(
  'updateUserComment',
  async (payload: UserDataUpdate, thunkAPI) => {
    return [payload, await parseUserCommentForData(payload.data)];
  }
);

export const updateUser = createAsyncThunk(
  'updateUser',
  async (payload: UsersState, thunkAPI) => {
    return payload;
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUserImage: (state, action: PayloadAction<UserDataUpdate>) => {
      updateUserData(state.users, action.payload, "profile_picture");

      if (state.currentUser?.id === action.payload.user_id) {
        state.currentUser.profile_picture = action.payload.data;
      }
    },
    deleteUser: (state, action: PayloadAction<number>) => {
      let userId = action.payload;
      let userIndex = state.users.findIndex(e => e.id === userId);
      state.users.splice(userIndex, 1);

    },
    updateCurrentUserById: (state, action: PayloadAction<number>) => {
      let currentUser = state.users.find(e => e.id === action.payload);
      if (currentUser) {
        state.currentUser = currentUser;
      }
    },
    updateConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    updateUserTalkingInfo(state, action: PayloadAction<{ user_id: number, talking: boolean }>) {
      let userIndex = state.users.findIndex(e => e.id === action.payload.user_id);
      if (userIndex !== -1) {
        state.users[userIndex].talking = action.payload.talking;
      }
    },
    updateCurrentUserListeningInfo(state, action: PayloadAction<{ self_mute: boolean, self_deaf: boolean }>) {
      if (state.currentUser) {
        state.currentUser.self_mute = action.payload.self_mute;
        state.currentUser.self_deaf = action.payload.self_deaf;
      }
    },
    updateUserSettings(state, action: PayloadAction<{ user_id: number, settings: UserCommentSettings }>) {
      let userIndex = state.users.findIndex(e => e.id === action.payload.user_id);
      if (userIndex !== -1) {
        if (!state.users[userIndex].commentData) {
          state.users[userIndex].commentData = {
            comment: "",
            background_picture: "",
            settings: {}
          }
        }
        state.users[userIndex].commentData.settings = action.payload.settings;

        if (state.currentUser?.id === action.payload.user_id) {
          state.currentUser.commentData = state.users[userIndex].commentData;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // @ts-ignore (stfu)
      .addCase<DataUpdateAction<any>>(updateUserComment.fulfilled, (state, action) => {
        let userIndex = state.users.findIndex(e => e.id === action.payload[0].user_id);
        if (userIndex !== -1) {
          state.users[userIndex].comment = action.payload[0].data;
          state.users[userIndex].commentData = action.payload[1];
        }

        if (state && state.currentUser && state?.currentUser?.id === action.payload[0].user_id) {
          state.currentUser.comment = action.payload[0].data;
          state.currentUser.commentData = action.payload[1];
        }
      })
      // @ts-ignore (stfu)
      .addCase<DataUpdateAction<any>>(updateUser.fulfilled, (state, action) => {
        console.log("updateUser", action.payload);

        let userId = action.payload.id;
        let userIndex = state.users.findIndex(e => e.id === userId);
        if (userIndex !== -1) {
          let muted_since = action.payload.self_mute && state.users[userIndex].self_mute !== action.payload.self_mute ? Date.now() : undefined;
          let deafened_since = action.payload.self_deaf && state.users[userIndex].self_deaf !== action.payload.self_deaf ? Date.now() : undefined;
          let profilePicture = state.users[userIndex].profile_picture;
          let comment = state.users[userIndex].comment;
          let joined = state.users[userIndex].joinedSince;

          state.users[userIndex] = action.payload;
          state.users[userIndex].comment = comment;
          state.users[userIndex].profile_picture = profilePicture;
          state.users[userIndex].mutedSince = muted_since;
          state.users[userIndex].deafenedSince = deafened_since;
          state.users[userIndex].joinedSince = joined;
        } else {
          // new user
          action.payload.talking = false;
          action.payload.joinedSince = Date.now();
          state.users.push(action.payload);
        }

        if (state.currentUser?.id === userId) {
          state.currentUser = state.users[userIndex];
        }
      });
  }
})

// Action creators are generated for each case reducer function
export const { deleteUser, updateUserImage, updateCurrentUserById, updateConnected, updateUserTalkingInfo, updateUserSettings, updateCurrentUserListeningInfo } = userSlice.actions

export default userSlice.reducer