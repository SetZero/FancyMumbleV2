import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface SenderInfo {
    user_id: number,
    user_name: string,
}
export interface TextMessage {
    // The message sender, identified by its session.
    actor: number,
    sender: SenderInfo,
    // The channels to which the message is sent, identified by their
    // channel_ids.
    channel_id: number[]
    // The root channels when sending message recursively to several channels,
    // identified by their channel_ids.
    tree_id: number[]
    // The UTF-8 encoded message. May be HTML if the server allows.
    message: string,
    // custom property to keep track of time
    timestamp: number,
    // unique id of the message
    id: string
}


const initialState: TextMessage[] = [];

export const chatMessageSlice = createSlice({
    name: 'channel',
    initialState,
    reducers: {
        addChatMessage: (state, action: PayloadAction<TextMessage>) => {
            console.log("addChatMessage: ", action.payload);
            state.push(action.payload);
        },
        deleteChatMessage: (state, action: PayloadAction<number>) => {
            let messageId = action.payload;
            let messageIndex = state.findIndex(e => e.timestamp === messageId);
            state.splice(messageIndex, 1);
        },
        deleteAllMessages: (state, action: PayloadAction<void>) => {
            state.length = 0;
        }
    },
})

export const { addChatMessage, deleteChatMessage, deleteAllMessages } = chatMessageSlice.actions

export default chatMessageSlice.reducer