import { Typography, Popover, Card, Avatar, CardMedia, CardContent, Paper, IconButton, InputBase, Divider, Box, Slider } from "@mui/material";
import { UsersState } from "../store/features/users/userSlice";
import React, { useEffect, useState } from "react";
import { getBackgroundFromComment, getProfileImage, getTextFromcomment } from "../helper/UserInfoHelper";
import SendIcon from '@mui/icons-material/Send';
import "./styles/UserInfo.css";
import dayjs from "dayjs";
import { ChatMessageHandler } from "../helper/ChatMessage";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/store";
import "./styles/common.css"
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

interface UserInfoProps {
    userInfo: UsersState | undefined;
    style?: React.CSSProperties;
}

function UserInfo(props: UserInfoProps) {
    const background = getBackgroundFromComment(props.userInfo, false);
    const profileText = getTextFromcomment(props.userInfo);
    const [chatMessage, setChatMessage] = useState("");
    const [voiceAdjustment, setVoiceAdjustment] = useState(0.0);
    const { t, i18n } = useTranslation();
    const userInfo = useSelector((state: RootState) => state.reducer.userInfo).currentUser;
    const locale = useSelector((state: RootState) => state.reducer.frontendSettings.language?.language) ?? 'en';

    const dispatch = useDispatch();
    const chatMessageHandler = new ChatMessageHandler(dispatch, setChatMessage);

    let mutedText = props.userInfo?.mutedSince ? dayjs(props.userInfo?.mutedSince).locale(locale).fromNow() : '';
    let deafenedText = props.userInfo?.deafenedSince ? dayjs(props.userInfo?.deafenedSince).locale(locale).fromNow() : '';
    let joinedText = props.userInfo?.joinedSince ? dayjs(props.userInfo?.joinedSince).locale(locale).fromNow() : '';

    function generateCardMedia() {
        if (background) {
            return (
                <CardMedia
                    component="img"
                    height="100"
                    image={background}
                    alt="green iguana"
                />
            );
        } else {
            return (
                <Box sx={{ width: '100%', height: 100 }} className="animated-background" />
            );
        }
    }

    function showStatusBox(statusText: string, status: string) {
        if (status) {
            return (
                <Box className="user-info-item">
                    <span className="user-text-title">{statusText}</span><span>{status}</span>
                </Box>
            )
        }
    }

    function keyDownHandler(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
        if (e && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatMessageHandler.sendPrivateMessage(chatMessage, props.userInfo?.id || 0);
        }
    }

    function getUserColors(): React.CSSProperties | undefined {
        if (props.userInfo) {
            let settings = props.userInfo?.commentData?.settings;

            let colors: React.CSSProperties = {};
            if (settings?.primary_color) colors.backgroundColor = settings.primary_color;
            if (settings?.accent_color) colors.backgroundColor = settings.accent_color;

            return colors;
        }
    }

    function updateVolumeAdjustment(adjustment: number) {
        let userId = props.userInfo?.id;
        if (userId) {
            invoke('set_audio_output_setting', { 'settings': { 'voice_adjustment': [{ 'volume': adjustment, 'user_id': userId }] } });
        }
    }

    function showVolumeAdjustment() {
        if (props.userInfo?.id !== userInfo?.id) {
            return (<Box>
                <Slider
                    sx={{ width: '80%', mx: 2, display: 'flex', justifyContent: 'center', margin: '0 auto' }}
                    onChange={(event, newValue) => {
                        if (Math.abs(Number(newValue)) < 0.5) {
                            setVoiceAdjustment(0);
                            return;
                        }
                        updateVolumeAdjustment(Number(newValue));
                        setVoiceAdjustment(Number(newValue));
                    }}
                    value={voiceAdjustment}
                    defaultValue={0}
                    step={0.1}
                    min={-20}
                    max={20}
                    valueLabelDisplay="auto"
                    marks={[{ value: -20, label: '-20 dB' }, { value: 0, label: '+0 dB' }, { value: 20, label: '+20 dB' }]} />
                <Divider sx={{ mt: 4, mb: 2 }} />
            </Box>);
        }
        return (<Box />)
    }

    return (
        <Card sx={{ maxWidth: 345 }} style={props.style}>
            {generateCardMedia()}
            <CardContent sx={{ paddingTop: 0, ...getUserColors() }}>
                <Box className="user-info-avatar">
                    <Avatar
                        alt={props.userInfo?.name}
                        src={getProfileImage(props.userInfo?.id || 0)}
                        sx={{ width: 80, height: 80, marginTop: '-40px', border: '2px solid #000' }}
                    />
                </Box>
                <Paper elevation={0} sx={{ padding: '10px', margin: '-30px 0 0 0' }}>
                    <Typography gutterBottom variant="h5" component="div" sx={{ textAlign: 'end' }}>
                        {props.userInfo?.name}
                    </Typography>
                    <Divider sx={{ margin: '10px 0' }} />
                    {showVolumeAdjustment()}
                    <Box className="user-info-list">
                        <Box className="user-info-item">
                            <span className="user-text-title">{t('User ID')}</span><span>#{props.userInfo?.id}</span>
                        </Box>
                        {showStatusBox(t('Muted'), mutedText)}
                        {showStatusBox(t('Deafened'), deafenedText)}
                        {showStatusBox(t('Joined'), joinedText)}
                    </Box>
                    <Divider sx={{ margin: '10px 0' }} />
                    <Box className="user-info-text">
                        <Box className="user-profile-content" dangerouslySetInnerHTML={{ __html: profileText }}></Box>
                    </Box>
                    <Paper
                        component="form"
                        sx={{ p: '2px 4px', display: 'flex', alignItems: 'center' }}
                        elevation={1}
                    >
                        <InputBase
                            sx={{ ml: 1, flex: 1 }}
                            placeholder={t("write user a message", {ns: "user_interaction", user: props.userInfo?.name})}
                            inputProps={{ 'aria-label': 'search google maps' }}
                            onChange={e => setChatMessage(e.target.value)}
                            onKeyDown={keyDownHandler}
                            value={chatMessage}
                        />
                        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                        <IconButton color="primary" sx={{ p: '10px' }} aria-label="directions">
                            <SendIcon />
                        </IconButton>
                    </Paper>
                </Paper>
            </CardContent>
        </Card>
    );
}

export default UserInfo;