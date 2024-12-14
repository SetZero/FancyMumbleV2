import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/store";
import { getBackgroundFromComment, getProfileImage } from "../helper/UserInfoHelper";
import { Avatar, Box, Typography } from "@mui/material";
import ChannelSearch from "./ChannelSearch";
import MicIcon from '@mui/icons-material/Mic';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import MicOffIcon from '@mui/icons-material/MicOff';
import './styles/CurrentUserInfo.css'
import { invoke } from "@tauri-apps/api/core";
import { UpdateableUserState, UsersState } from "../store/features/users/userSlice";
import "./styles/common.css"
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { updateUIState, updateUserState } from "../store/features/users/frontendSettings";
import { persistFrontendSettings } from "../store/persistance/persist";

const selectCurrentUser = (state: RootState) => state.reducer.userInfo.currentUser;

const customEqual = (oldUser: UsersState | undefined, newUser: UsersState | undefined) => {
    if (oldUser === newUser) return true;
    if (oldUser === undefined || newUser === undefined) return false;

    return (
        oldUser.comment === newUser.comment &&
        oldUser.self_mute === newUser.self_mute &&
        oldUser.self_deaf === newUser.self_deaf &&
        oldUser.name === newUser.name &&
        oldUser.id === newUser.id
    );
};

function CurrentUserInfo() {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const currentUser = useSelector(selectCurrentUser, customEqual);
    const frontendSettings = useSelector((state: RootState) => state.reducer.frontendSettings);
    const uiUserState = frontendSettings.user_state;

    const userBackground = useMemo(() => getBackgroundFromComment(currentUser), [currentUser?.comment]);

    const updateUserValue = useCallback((update: (currentUser: UsersState, operator: UpdateableUserState) => void) => {
        if (currentUser) {
            let currentUserClone: UpdateableUserState = { id: currentUser.id };

            update(currentUser, currentUserClone);
            invoke('change_user_state', { userState: currentUserClone });
            syncUiState(currentUserClone);
        }
    }, [currentUser]);

    const syncUiState = (userInfo: UpdateableUserState) => {
        let newState = { ...uiUserState, self_mute: userInfo?.self_mute ?? false, self_deaf: userInfo?.self_deaf ?? false };
        dispatch(updateUserState(newState));
        persistFrontendSettings({ ...frontendSettings, user_state: newState });
    };

    const muteToggleUser = useCallback(() => {
        updateUserValue((currentUser, currentUserClone) => currentUserClone.self_mute = !currentUser.self_mute);
    }, [updateUserValue, currentUser?.self_mute]);

    const deafToggleUser = useCallback(() => {
        updateUserValue((currentUser, currentUserClone) => currentUserClone.self_deaf = !currentUser.self_deaf);
    }, [updateUserValue, currentUser?.self_deaf]);


    const MicrophoneState = useMemo(() => {
        if (currentUser?.self_mute) {
            return (<MicOffIcon className="small_icon" />)
        } else {
            return (<MicIcon className="small_icon" />)
        }
    }, [currentUser?.self_mute]);

    const VolumeState = useMemo(() => {
        if (currentUser?.self_deaf) {
            return (<VolumeOffIcon className="small_icon" />)
        } else {
            return (<VolumeUpIcon className="small_icon" />)
        }
    }, [currentUser?.self_deaf]);

    return (
        <Box style={{
            background: userBackground,
            display: 'flex',
            padding: '0 10px',
            backgroundSize: 'cover',
        }}
            className={userBackground ? "" : "animated-background"}>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
            }}>
                <Avatar
                    alt={currentUser?.name}
                    src={getProfileImage(currentUser?.id || -1)}
                    sx={{ width: 48, height: 48 }}
                />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '2px 10px', flexDirection: 'column', alignItems: 'center', width: '100%', textShadow: '1px 1px #000' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 'bold', textShadow: '2px 2px #000' }}>{currentUser?.name ?? t('Unknown User')}</Typography>
                        <Box onClick={muteToggleUser}>
                            {MicrophoneState}
                        </Box>
                        <Box onClick={deafToggleUser}>
                            {VolumeState}
                        </Box>
                    </Box>
                </Box>
                <ChannelSearch />
            </Box>
        </Box>)
}
export default CurrentUserInfo;