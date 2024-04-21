import { Box } from '@mui/material';

import ChatMessageContainer from '../components/ChatMessageContainer';

import Sidebar from '../components/Sidebar';
import { RootState } from '../store/store';
import { useDispatch, useSelector } from 'react-redux';
import ChatInput from '../components/ChatInput';
import { useCallback, useEffect, useMemo, useState } from 'react';

import ChatInfoBar from '../components/ChatInfoBar';
import EventLog from '../components/EventLog';
import QuillChatInput from '../components/QuillChatInput';
import { persistentStorage } from '../store/persistance/persist';
import { FrontendSettings, updateFrontendSettings } from '../store/features/users/frontendSettings';
import { updateAudioSettings } from '../store/features/users/audioSettings';
import { invoke } from "@tauri-apps/api/core";
import i18n from '../i18n/i18n';
import { updateCurrentUserListeningInfo } from '../store/features/users/userSlice';


function Chat() {
    const [showLog, setShowLog] = useState(false);
    const [loading, setLoading] = useState(false);

    const messageLog = useSelector((state: RootState) => state.reducer.chatMessage);
    const useWYSIWYG = useSelector((state: RootState) => state.reducer.frontendSettings?.advancedSettings?.useWYSIWYG);
    const dispatch = useDispatch();

    const fetchSettings = useCallback(async () => {
        const frontendSettings = await persistentStorage.get<FrontendSettings>("frontendSettings");
        const audioSettings = await persistentStorage.get("audioSettings");
        invoke('set_audio_input_setting', { 'settings': audioSettings });

        dispatch(updateFrontendSettings(frontendSettings));
        dispatch(updateAudioSettings(audioSettings));
        console.log("Settings fetched: ", frontendSettings);

        let self_mute = frontendSettings?.user_state.self_mute ?? true;
        let self_deaf = frontendSettings?.user_state.self_deaf ?? true;
        dispatch(updateCurrentUserListeningInfo({
            self_mute: self_mute,
            self_deaf: self_deaf
        }));
        invoke('change_user_state', { userState: { self_mute: self_mute, self_deaf: self_deaf } });

        if (frontendSettings?.language?.language) {
            i18n.changeLanguage(frontendSettings.language.language);
        }
        console.log("Settings fetched");
    }, [])

    useEffect(() => {
        fetchSettings().then(() => setLoading(false));
    }, [fetchSettings]);

    let selectChatInput = useMemo(() => {
        if (useWYSIWYG) {
            return (<QuillChatInput />);
        } else {
            return (<ChatInput />);
        }
    }, [useWYSIWYG]);

    return (
        <Box sx={{ height: '100%', display: (loading ? 'none' : 'flex'), flexDirection: 'row' }}>
            <Sidebar />
            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{
                        width: '100%',
                        height: '100%',
                        filter: ' blur(10px)',
                        background: 'transparent',
                        backgroundSize: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: -1
                    }}></Box>
                    <ChatInfoBar onShowLog={setShowLog} />
                    <ChatMessageContainer messages={messageLog}></ChatMessageContainer>
                    {selectChatInput}
                </Box>
            </Box>
            <EventLog showLog={showLog} />
        </Box>
    )
}

export default Chat;
