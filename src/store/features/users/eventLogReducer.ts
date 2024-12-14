import { createSlice } from "@reduxjs/toolkit";
import { UserInfoState, UsersState, deleteUser, updateUser } from "./userSlice";
import dayjs from "dayjs";
import { ChannelState } from "./channelSlice";
import { useTranslation } from "react-i18next";
import i18next from "i18next";

interface EventLogState {
    timestamp: number
    logMessage: string
}

interface CheckData {
    condition: (userInfo: UsersState | null, payload: UsersState) => boolean;
    message: (userInfo: UsersState | null, payload: UsersState, storeAPI?: any) => string;
    stopAfter?: (userInfo: UsersState | null) => boolean;
}

const checks: CheckData[] = [
    {
        condition: (userInfo, payload) => !userInfo,
        message: (userInfo, payload) => i18next.t("User Joined the Server", { ns: "user_interaction", user: payload.name }),
        stopAfter: (userInfo) => !userInfo
    },
    {
        condition: (userInfo, payload) => userInfo?.self_deaf !== payload.self_deaf && userInfo?.self_mute !== payload.self_mute,
        message: (userInfo, payload) => `${userInfo?.name} ${payload.self_deaf ? "deafened" : "undeafened"} and ${payload.self_mute ? "muted" : "unmuted"}`
    },
    {
        condition: (userInfo, payload) => userInfo?.self_deaf !== payload.self_deaf,
        message: (userInfo, payload) => `${userInfo?.name} ${payload.self_deaf ? "deafened" : "undeafened"}`
    },
    {
        condition: (userInfo, payload) => userInfo?.self_mute !== payload.self_mute,
        message: (userInfo, payload) => `${userInfo?.name} ${payload.self_mute ? "muted" : "unmuted"}`
    },
    {
        condition: (userInfo, payload) => userInfo?.mute !== payload.mute,
        message: (userInfo, payload) => `${userInfo?.name} ${payload.mute ? "was muted" : "was unmuted"} by unknown`
    },
    {
        condition: (userInfo, payload) => userInfo?.deaf !== payload.deaf,
        message: (userInfo, payload) => `${userInfo?.name} ${payload.deaf ? "was deafened" : "was undeafened"} by unknown`
    },
    {
        condition: (userInfo, payload) => userInfo?.channel_id !== payload.channel_id,
        message: (userInfo, payload, storeAPI: any) => {
            const channelInfo = findChannelById(payload.channel_id, storeAPI);
            const oldChannel = findChannelById(userInfo?.channel_id || -1, storeAPI);
            return `${userInfo?.name} joined ${channelInfo?.name} from ${oldChannel?.name}`;
        }
    },
    {
        condition: (userInfo, payload) => userInfo?.priority_speaker !== payload.priority_speaker,
        message: (userInfo, payload) => `${userInfo?.name} ${payload.priority_speaker ? "is now a priority speaker" : "is no longer a priority speaker"}`
    },
    {
        condition: (userInfo, payload) => userInfo?.suppress !== payload.suppress,
        message: (userInfo, payload) => `${userInfo?.name} ${payload.suppress ? "is now suppressed" : "is no longer suppressed"}`
    },
    {
        condition: (userInfo, payload) => userInfo?.name !== payload.name,
        message: (userInfo, payload) => `${userInfo?.name} changed their name to ${payload.name}`
    },
    {
        condition: (userInfo, payload) => userInfo?.recording !== payload.recording,
        message: (userInfo, payload) => `${userInfo?.name} ${payload.recording ? "started recording" : "stopped recording"}`
    }
];

// Handle function for updateUser.fulfilled
function handleUpdateUser(action: { payload: UsersState }, storeAPI: any) {
    const userState: UserInfoState = storeAPI.getState().reducer.userInfo;
    const userId = action.payload.id;
    const userInfo = getUserInfo(userState, userId);

    checks.every(({condition, message, stopAfter}) => {
        if(condition(userInfo, action.payload)) {
            storeAPI.dispatch(eventLogSlice.actions.dispatchEventLog({ message: message(userInfo, action.payload, storeAPI) }));
        }
        if(stopAfter && stopAfter(userInfo)) return false;
        return true;
    });
}

// Handle function for deleteUser
function handleDeleteUser(action: { payload: any; }, storeAPI: any) {
    const userState: UserInfoState = storeAPI.getState().reducer.userInfo;
    const userId = action.payload;
    const userInfo = getUserInfo(userState, userId);

    if (!userInfo) return;

    storeAPI.dispatch(eventLogSlice.actions.dispatchEventLog({ message: `${userInfo.name} left the server` }));
}

// Get user info
function getUserInfo(userState: UserInfoState, userId: number) {
    const userIndex = userState?.users?.findIndex((e: { id: any; }) => e.id === userId);

    if (userIndex === undefined || userIndex === -1) return null;

    return userState.users[userIndex];
}

function findChannelById(channelId: number, storeAPI: any) {
    const channelState: ChannelState[] = storeAPI.getState().reducer.channel;
    console.log(channelState)
    const channelIndex = channelState?.findIndex((e: ChannelState) => e.channel_id === channelId);

    if (channelIndex === undefined || channelIndex === -1) return null;

    return channelState[channelIndex];
}

const actionHandlers = {
    [updateUser.fulfilled.type]: handleUpdateUser,
    [deleteUser.type]: handleDeleteUser,
};

export const checkStatusChangedMiddleware =
    (storeAPI: any) =>
        (next: (arg0: any) => any) =>
            (action: { type: string; payload: any }) => {
                // Call the correct handler based on action type
                const handler = actionHandlers[action.type];
                if (handler) handler(action, storeAPI);

                return next(action);
            };

const initialState: EventLogState[] = [];

export const eventLogSlice = createSlice({
    name: 'eventLog',
    initialState, // Your initial state
    reducers: {
        dispatchEventLog: (state, action) => {
            state.push({ timestamp: Date.now(), logMessage: `${action.payload.message}` });
        },
    },
});

export default eventLogSlice.reducer;