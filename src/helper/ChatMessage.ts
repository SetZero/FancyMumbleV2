import { invoke } from "@tauri-apps/api/core";
import { TextMessage, addChatMessage, deleteAllMessages } from "../store/features/users/chatMessageSlice";
import { UsersState } from "../store/features/users/userSlice";
import MessageParser from "./MessageParser";
import { Dispatch } from "react";
import { AnyAction } from "@reduxjs/toolkit";

export class ChatMessageHandler {
    deleteMessages() {
        this.dispatch(deleteAllMessages());
    }

    constructor(private dispatch: Dispatch<AnyAction>, private setChatMessage: any) {

    }

    pushChatMessage(message: TextMessage) {
        this.dispatch(addChatMessage(message));
    }

    public sendCustomChatMessage(data: string, userInfo: UsersState | undefined) {
        invoke('send_message', { chatMessage: data, channelId: userInfo?.channel_id });
        this.pushChatMessage({
            actor: userInfo?.id ?? 0,
            sender: {
                user_id: userInfo?.id ?? 0,
                user_name: userInfo?.name ?? 'unknown'
            },
            channel_id: [0],
            tree_id: [0],
            message: data,
            timestamp: Date.now(),
            id: ""
        });
        this.setChatMessage("");
    }

    public sendPrivateMessage(data: string, reciever: number) {
        invoke('send_message', { chatMessage: data, reciever: reciever });
        this.setChatMessage("");
    }

    public sendChatMessage(chatMessage: string, userInfo: UsersState | undefined) {
        if (chatMessage.length === 0) return;
        console.log("sending message", chatMessage);

        let message = new MessageParser(chatMessage)
            .parseLinks()
            .parseCommands(userInfo, (chatMessage: string, userInfo: UsersState | undefined) => {
                this.sendCustomChatMessage(chatMessage, userInfo);
            })
            .parseDOM((dom) => dom
                .parseForVideos()
            )
            .parseMarkdown()
            .buildString();
        this.sendCustomChatMessage(message, userInfo);
    }
}