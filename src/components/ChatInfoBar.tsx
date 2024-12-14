import { Box, IconButton, Paper, Tooltip } from '@mui/material';


import { RootState } from '../store/store';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo } from 'react';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import React from 'react';
import { updateUIState } from '../store/features/users/frontendSettings';
import { persistFrontendSettings } from '../store/persistance/persist';

interface ChatInfoBarProps {
}

const ChatInfoBar: React.FC<ChatInfoBarProps> = React.memo(({ }) => {
    const dispatch = useDispatch();
    const frontendSettings = useSelector((state: RootState) => state.reducer.frontendSettings);
    const showSidebar = frontendSettings.ui_state.show_sidebar;


    const currentChannelId = useSelector((state: RootState) => state.reducer.userInfo.currentUser?.channel_id);
    const channelInfo = useSelector((state: RootState) => state.reducer.channel.find(e => e.channel_id === currentChannelId));

    const eventLogIcon = useMemo(() => {
        if (!showSidebar) return (<AutoStoriesIcon sx={{ fontSize: 20 }} />);
        return (<KeyboardDoubleArrowRightIcon sx={{ fontSize: 20 }} />);
    }, [showSidebar]);


    function toggleSidebar(): void {
        console.log("old front end: ", frontendSettings)
        let newSidebarState = !showSidebar;
        let newState = { ...frontendSettings.ui_state, show_sidebar: newSidebarState };
        dispatch(updateUIState(newState));
        persistFrontendSettings({ ...frontendSettings, ui_state: newState });
        console.log("front end settings updated: ", frontendSettings)
    }

    return (
        <Box sx={{ flexShrink: 1 }}>
            <Paper elevation={0} sx={{ backgroundImage: `url(${channelInfo?.channelImage})`, backgroundSize: 'contain' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', backdropFilter: 'blur(20px)', textShadow: '1px 1px #000' }}>
                    <Box sx={{ flexGrow: 1, paddingLeft: 1 }}>
                        {channelInfo?.name}
                    </Box>
                    <Box sx={{ flexGrow: 0 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <Tooltip title={showSidebar ? 'Hide Log' : 'Show Log'}>
                                <IconButton size="small" onClick={() => toggleSidebar()}>
                                    {eventLogIcon}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>

    )
});

export default ChatInfoBar;