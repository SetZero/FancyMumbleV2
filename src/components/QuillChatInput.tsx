import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChatMessageHandler } from "../helper/ChatMessage";
import { RootState } from "../store/store";
import QuillEditor from "./QuillEditor";
import { Box, Button, Divider, Fade, IconButton, Paper, Popper, Tooltip } from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import GifIcon from '@mui/icons-material/Gif';
import GifSearch, { GifResult } from "./GifSearch";
import { t } from "i18next";

function QuillChatInput() {
    const dispatch = useDispatch();
    const [chatMessage, setChatMessage] = useState("");
    const [showDeleteMessageConfirmation, setShowDeleteMessageConfirmation] = useState(false);
    const [messageDeleteAnchor, setMessageDeleteAnchor] = useState<HTMLElement>();
    const [showGifSearch, setShowGifSearch] = useState(false);
    const [gifSearchAnchor, setGifSearchAnchor] = useState<HTMLElement>();

    const chatMessageHandler = useMemo(() => new ChatMessageHandler(dispatch, setChatMessage), [dispatch]);
    const currentUser = useSelector((state: RootState) => state.reducer.userInfo?.currentUser);
    const channelInfo = useSelector((state: RootState) => state.reducer.channel);
    const currentChannel = useMemo(() => channelInfo.find(e => e.channel_id === currentUser?.channel_id)?.name, [channelInfo, currentUser]);

    const keyDownHandler = (e: KeyboardEvent) => {
        if (e && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatMessageHandler.sendChatMessage(chatMessage, currentUser);
            setChatMessage("");
        }
    };

    const showDeleteMessageConfirmationDialog = useCallback((e: any) => {
        setShowDeleteMessageConfirmation(prev => !prev);
        setMessageDeleteAnchor(e.currentTarget)
    }, []);

    const showGifPreview = useCallback((e: any) => {
        setShowGifSearch(prev => !prev);
        setGifSearchAnchor(e.currentTarget)
    }, []);

    const deleteMessages = useCallback(() => {
        chatMessageHandler.deleteMessages();
    }, [chatMessageHandler]);

    function updateContent(content: string): void {
        setChatMessage(content);
    }

    function sendGif(gif: GifResult): void {
        chatMessageHandler.sendCustomChatMessage(`<img src="${gif.media[0].gif.url}" width="${gif.media[0].gif.dims[0]}" />`, currentUser);
    }

    return (
        <Box m={2} sx={{ display: 'flex' }}>
            <Paper
                component="form"
                sx={{ p: '2px 4px', display: 'flex', width: 400, flexGrow: 1, alignItems: 'flex-start' }}
            >
                <Tooltip title={t("Delete all messages", { ns: "user_interaction" })}>
                    <IconButton sx={{ p: '10px' }} aria-label="menu" onClick={showDeleteMessageConfirmationDialog}>
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
                <QuillEditor
                    style={{ flexGrow: 1, maxHeight: 200 }}
                    onKeyDown={(e: KeyboardEvent) => keyDownHandler(e)}
                    onChange={(content: string) => updateContent(content)}
                    value={chatMessage}
                    theme="bubble"
                    placeholder={t("Send Message to Channel", { ns: "user_interaction", channel: currentChannel })}
                />
                <IconButton onClick={showGifPreview}>
                    <GifIcon />
                </IconButton>
                <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                <IconButton sx={{ p: '10px' }} aria-label="Send Message" onClick={() => chatMessageHandler.sendChatMessage(chatMessage, currentUser)}>
                    <SendIcon />
                </IconButton>
            </Paper>
            <GifSearch open={showGifSearch} anchor={gifSearchAnchor} onGifSelected={(gif) => sendGif(gif)} />
            <Popper open={showDeleteMessageConfirmation} anchorEl={messageDeleteAnchor} transition>
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps}>
                        <Paper sx={{ p: 1 }}>
                            <Box sx={{ p: 1 }}>
                                {t('Are you sure you want to delete all messages?', { ns: 'user_interaction' })}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button onClick={(data) => {
                                        deleteMessages();
                                        showDeleteMessageConfirmationDialog(data);
                                    }}
                                        color="error">{t('Yes', { ns: "user_interaction" })}</Button>
                                    <Button onClick={showDeleteMessageConfirmationDialog} color="primary">{t('No', { ns: 'user_interaction' })}</Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Fade>
                )}
            </Popper>
        </Box>
    );
}

export default QuillChatInput;