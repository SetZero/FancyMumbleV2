import { combineReducers, configureStore } from '@reduxjs/toolkit'
import userReducer from './features/users/userSlice';
import channelReducer from './features/users/channelSlice';
import chatMessageReducer from './features/users/chatMessageSlice';
import eventLogReducer, { checkStatusChangedMiddleware } from './features/users/eventLogReducer';
import frontendSettingsReducer from './features/users/frontendSettings';
import audioSettingsReducer from './features/users/audioSettings';
import serverReducer from './features/server/serverSlice';

const combinedReducer = combineReducers({
  server: serverReducer,
  channel: channelReducer,
  userInfo: userReducer,
  chatMessage: chatMessageReducer,
  frontendSettings: frontendSettingsReducer,
  audioSettings: audioSettingsReducer
})

const rootReducer = (state: any, action: any) => {
  if (action.type === 'logout') {
    console.log("clearing state");
    state = undefined
    //TODO: create middleware to navigate to login page
  }
  return combinedReducer(state, action)
}

export const store = configureStore({
  reducer: {
    reducer: rootReducer,
    eventLog: eventLogReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(checkStatusChangedMiddleware),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch