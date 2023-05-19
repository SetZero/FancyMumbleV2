import { Avatar, Box, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, ListSubheader } from "@mui/material";
import { ChannelState } from "../store/features/users/channelSlice";
import { UsersState } from "../store/features/users/userSlice";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { invoke } from "@tauri-apps/api";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { ReactNode } from "react";
import './styles/ChannelViewer.css';
import UserInfo from "./UserInfo";
import React from "react";

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
        invoke('join_channel', { channelId: channelId });
    }

    function displayUserInfo(user: UsersState): ReactNode {
        return (
            <span>
                {user.self_mute ? (<MicOffIcon fontSize="small" />) : (<span />)}
                {user.self_deaf ? (<VolumeOffIcon fontSize="small" />) : (<span />)}
                {user.mute ? (<MicOffIcon color="error" fontSize="small" />) : (<span />)}
                {user.deaf ? (<VolumeOffIcon color="error" fontSize="small" />) : (<span />)}
            </span>
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
                <UserInfo
                    anchorEl={userInfoAnchor}
                    onClose={() => setUserInfoAnchor(null)}
                    userInfo={user}
                />
            )
        }
    }

    return (
        <List subheader={<li />}>
            {
                Array.from(getChannelUserMapping()).map(([channel, users]) => (
                    <li key={`channel-${channel.channel_id}`}>
                        <ul style={{ padding: 0 }}>
                            <ListSubheader className="subheader-flex" sx={{ padding: '0' }} onClick={e => joinChannel(channel.channel_id)}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '5px' }}>
                                    {channel.name}
                                    <ListItemIcon className="join-button" style={{ cursor: 'pointer', filter: 'drop-shadow(1px 1px 1px #000)' }}>
                                        <ArrowForwardIosIcon />
                                    </ListItemIcon>
                                </Box>
                            </ListSubheader>
                            {users.map((user) => (
                                <Box key={`user-${user.id}`}>
                                    <ListItem key={user.id} sx={{ py: 0, minHeight: 32 }}>
                                        <ListItemAvatar sx={{ width: 24, height: 24, minWidth: 0, marginRight: 1 }}>
                                            <Avatar
                                                sx={{ width: 24, height: 24 }}
                                                src={user.profile_picture}
                                                className={(isTalking(user.id) ? 'talking-avatar' : 'silent-avatar')}
                                                onClick={e => { setUserInfoAnchor(e.currentTarget); setSelectedUser(user) }}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 'medium', display: 'flex', flexGrow: 1 }} className="user-list-item">
                                            <span className="user-name-item">{user.name}</span>
                                            <span className="user-state-item">{displayUserInfo(user)}</span>
                                        </ListItemText>
                                    </ListItem>
                                </Box>
                            ))
                            }
                            {showUserInfo(selectedUser)}
                        </ul>
                    </li>
                ))
            }
        </List>
    )
}

export default ChannelViewer;