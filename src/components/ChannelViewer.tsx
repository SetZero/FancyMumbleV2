import { Avatar, Box, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, ListSubheader } from "@mui/material";
import { ChannelState } from "../store/features/users/channelSlice";
import { UsersState } from "../store/features/users/userSlice";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { invoke } from "@tauri-apps/api/core";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { ReactNode } from "react";
import './styles/ChannelViewer.css';
import UserInfo from "./UserInfo";
import React from "react";
import UserInfoPopover from "./UserInfoPopover";

function ChannelViewer() {
    const userList = useSelector((state: RootState) => state.reducer.userInfo);
    const channelList = useSelector((state: RootState) => state.reducer.channel);
    const [userInfoAnchor, setUserInfoAnchor]: any = React.useState(null);
    const [selectedUser, setSelectedUser]: any = React.useState(null);

    function getChannelUserMapping() {
        let channelUserMapping: Map<ChannelState, UsersState[]> = new Map();
        userList.users.forEach(user => {
            let channel = channelList.find(channel => channel.channel_id === user.channel_id);
            if (channel !== undefined) {
                if (channelUserMapping.has(channel)) {
                    channelUserMapping.get(channel)?.push(user);
                } else {
                    channelUserMapping.set(channel, [user]);
                }
            }
        });
        return channelUserMapping;
    }

    function joinChannel(channelId: number) {
        invoke('change_user_state', { userState: { channel_id: channelId } });
    }

    function displayUserInfo(user: UsersState): ReactNode {
        return (
            <Box sx={{ display: 'flex' }}>
                {user.self_mute ? (<MicOffIcon color="error" fontSize="small" />) : (<span />)}
                {user.self_deaf ? (<VolumeOffIcon color="error" fontSize="small" />) : (<span />)}
                {user.mute ? (<MicOffIcon color="info" fontSize="small" />) : (<span />)}
                {user.deaf ? (<VolumeOffIcon color="info" fontSize="small" />) : (<span />)}
            </Box>
        )
    }

    function isTalking(userId: number): boolean {
        let user = userList.users.find(user => user.id === userId);
        if (user !== undefined && user.talking) {
            return true;
        }
        return false;
    }

    function showUserInfo(user: UsersState) {
        if (userInfoAnchor) {
            return (
                <UserInfoPopover
                    anchorEl={userInfoAnchor}
                    onClose={() => setUserInfoAnchor(null)}
                    userInfo={user}
                />
            )
        }
    }

    return (
        <Box sx={{ overflowY: 'auto', display: 'flex', flexGrow: 1 }}>
            {showUserInfo(selectedUser)}
            <List subheader={<li />} sx={{ width: '100%' }}>
                {
                    Array.from(getChannelUserMapping()).map(([channel, users]) => (
                        <li key={`channel-${channel.channel_id}`}>
                            <ul style={{ padding: 0 }}>
                                <ListSubheader className="subheader-flex" sx={{ padding: '0' }} onClick={e => joinChannel(channel.channel_id)}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '5px' }}>
                                        <Box sx={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', flexGrow: 1, width: '1px' }} title={channel.name}>{channel.name}</Box>
                                        <ListItemIcon className="join-button" style={{ cursor: 'pointer', filter: 'drop-shadow(1px 1px 1px #000)' }}>
                                            <ArrowForwardIosIcon />
                                        </ListItemIcon>
                                    </Box>
                                </ListSubheader>
                                {users.map((user) => (
                                    <Box key={`user-${user.id}`}>
                                        <ListItem key={user.id} sx={{ py: 0, minHeight: 32, maxWidth: '100%' }}>
                                            <ListItemAvatar sx={{ width: 24, height: 24, minWidth: 0, marginRight: 1 }}>
                                                <Avatar
                                                    sx={{ width: 24, height: 24, cursor: 'pointer' }}
                                                    src={user.profile_picture}
                                                    className={(isTalking(user.id) ? 'talking-avatar' : 'silent-avatar')}
                                                    onClick={e => { setUserInfoAnchor(e.currentTarget); setSelectedUser(user) }}
                                                />
                                            </ListItemAvatar>
                                            <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 'medium', display: 'flex', flexGrow: 1, maxWidth: '100%' }} className="user-list-item">
                                                <Box sx={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', display: 'flex', flexGrow: 1, alignItems: 'center' }}><span className="user-name-item">{user.name}</span></Box>
                                                <Box className="user-state-item">{displayUserInfo(user)}</Box>
                                            </ListItemText>
                                        </ListItem>
                                    </Box>
                                ))
                                }
                            </ul>
                        </li>
                    ))
                }
            </List>
        </Box>
    )
}

export default ChannelViewer;