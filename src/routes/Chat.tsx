import { Box, Divider, IconButton, InputBase, Paper } from '@mui/material';
import { invoke } from '@tauri-apps/api';
import { useEffect, useState } from 'react';
import SendIcon from '@mui/icons-material/Send';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import ChatMessageContainer from '../components/ChatMessageContainer';
import GifIcon from '@mui/icons-material/Gif';
import GifSearch from '../components/GifSearch';
import React from 'react';
import Sidebar from '../components/Sidebar';
import { RootState } from '../store/store';
import { useDispatch, useSelector } from 'react-redux';
import { formatBytes } from '../helper/Fomat';
import { UpdateableUserState, UsersState } from '../store/features/users/userSlice';
import { ChatMessageHandler } from '../helper/ChatMessage';
import { unregister } from '@tauri-apps/api/globalShortcut';

function Chat() {
    const [chatMessage, setChatMessage] = useState("");
    const [showGifSearch, setShowGifSearch] = useState(false);
    const [gifSearchAnchor, setGifSearchAnchor] = useState<HTMLElement>();

    const dispatch = useDispatch();
    const userInfo = useSelector((state: RootState) => state.reducer.userInfo);
    const channelInfo = useSelector((state: RootState) => state.reducer.channel);
    const messageLog = useSelector((state: RootState) => state.reducer.chatMessage);

    const currentChannel = channelInfo.find(e => e.channel_id === userInfo.currentUser?.channel_id)?.name;

    const chatMessageHandler = new ChatMessageHandler(dispatch, setChatMessage);

    useEffect(() => {
        unregister('F13');
        /*register('F13', () => {
            console.log('F13 is pressed');
            if (userInfo.currentUser)
                updateUserValue((currentUser, currentUserClone) => currentUserClone.self_mute = !currentUser.self_mute);
        });*/
    });

    async function updateUserValue(update: (currentUser: UsersState, operator: UpdateableUserState) => void) {
        if (userInfo.currentUser) {
            let currentUser = userInfo.currentUser;
            let currentUserClone: UpdateableUserState = { id: currentUser.id };

            update(currentUser, currentUserClone);
            await invoke('change_user_state', { userState: currentUserClone }).catch(e => console.log(e));
        }
    }



    function keyDownHandler(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
        if (e && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatMessageHandler.sendChatMessage(chatMessage, userInfo.currentUser);
        }
    }

    function uploadFile(e: any) {
        //TODO
    }

    function showGifPreview(e: any) {
        setShowGifSearch(!showGifSearch);
        setGifSearchAnchor(e.currentTarget)
    }

    function pasteEvent(event: any) {
        let items = event.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function () {
                    if (reader.result && (reader.result as string).length > 0x7fffff) {
                        chatMessageHandler.sendCustomChatMessage("[[ Image too large ( " + formatBytes((reader.result as string).length) + " out of " + formatBytes(0x7fffff) + ") ]]", userInfo.currentUser);
                        return;
                    }
                    let img = '<img src="' + reader.result + '" />';
                    chatMessageHandler.sendCustomChatMessage(img, userInfo.currentUser);
                };
            }
        }
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
            <Sidebar />
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <ChatMessageContainer messages={messageLog}></ChatMessageContainer>
                    <Box m={2} sx={{ display: 'flex' }}>
                        <Paper
                            component="form"
                            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400, flexGrow: 1 }}
                        >
                            <IconButton sx={{ p: '10px' }} aria-label="menu" onClick={uploadFile}>
                                <AddToPhotosIcon />
                            </IconButton>
                            <InputBase
                                sx={{ ml: 1, flex: 1 }}
                                placeholder={"Send Message to " + currentChannel}
                                inputProps={{ 'aria-label': 'Send Message to ' + currentChannel }}
                                onChange={e => setChatMessage(e.target.value)}
                                onKeyDown={keyDownHandler}
                                value={chatMessage}
                                onPaste={pasteEvent}
                                multiline
                            />
                            <IconButton onClick={showGifPreview}>
                                <GifIcon />
                            </IconButton>
                            <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                            <IconButton sx={{ p: '10px' }} aria-label="Send Message" onClick={() => chatMessageHandler.sendChatMessage(chatMessage, userInfo.currentUser)}>
                                <SendIcon />
                            </IconButton>
                        </Paper>
                    </Box>
                </Box>
                <GifSearch open={showGifSearch} anchor={gifSearchAnchor} />
            </Box>
        </Box>
    )
}

export default Chat;