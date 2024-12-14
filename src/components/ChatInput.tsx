import { Box, Button, Divider, Fade, IconButton, InputBase, Paper, Popper, Tooltip } from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import GifIcon from '@mui/icons-material/Gif';
import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { ChatMessageHandler } from "../helper/ChatMessage";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/store";
import { formatBytes } from "../helper/Fomat";
import GifSearch, { GifResult } from "./GifSearch";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import ContextMenu from "./contextMenus/ContextMenu";
import { copy, paste } from "./contextMenus/ContextMenuOptions";


function ChatInput() {
    const dispatch = useDispatch();
    const { t, i18n } = useTranslation();

    const [showGifSearch, setShowGifSearch] = useState(false);
    const [showDeleteMessageConfirmation, setShowDeleteMessageConfirmation] = useState(false);

    const [chatMessage, setChatMessage] = useState("");
    const [gifSearchAvailable, setGifSearchAvailable] = useState(false);
    const [gifSearchAnchor, setGifSearchAnchor] = useState<HTMLElement>();
    const [messageDeleteAnchor, setMessageDeleteAnchor] = useState<HTMLElement>();
    const currentUser = useSelector((state: RootState) => state.reducer.userInfo?.currentUser);
    const channelInfo = useSelector((state: RootState) => state.reducer.channel);

    const sendElementRef = useRef<HTMLButtonElement>(null);

    const currentChannel = useMemo(() => channelInfo.find(e => e.channel_id === currentUser?.channel_id)?.name, [channelInfo, currentUser]);
    const chatMessageHandler = useMemo(() => new ChatMessageHandler(dispatch, setChatMessage), [dispatch]);

    const pasteAndSend = {
        icon: <SendIcon />,
        label: t('Paste and Send', { ns: 'user_interaction' }),
        shortcut: 'Ctrl+Shift+V',
        handler: (event: React.MouseEvent<HTMLElement>) => {
            event.preventDefault();
            navigator.clipboard.readText().then(clipText => {
                chatMessageHandler.sendChatMessage(clipText, currentUser);
            });
        }
    };

    const deleteMessages = useCallback(() => {
        chatMessageHandler.deleteMessages();
    }, [chatMessageHandler]);

    const keyDownHandler = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatMessageHandler.sendChatMessage(chatMessage, currentUser);
        }
    }, [chatMessage, chatMessageHandler, currentUser]);

    const showGifPreview = useCallback((e: any) => {
        setShowGifSearch(prev => !prev);
        setGifSearchAnchor(e.currentTarget)
    }, []);

    const showDeleteMessageConfirmationDialog = useCallback((e: any) => {
        setShowDeleteMessageConfirmation(prev => !prev);
        setMessageDeleteAnchor(e.currentTarget)
    }, []);

    const pasteEvent = useCallback((event: any) => {
        let items = event.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function () {
                    if (reader.result && (reader.result as string).length > 0x7fffff) {
                        chatMessageHandler.sendCustomChatMessage(t("Image too large", { size: formatBytes((reader.result as string).length), maximum: formatBytes(0x7fffff) }), currentUser);
                        return;
                    }
                    const legacyImageSize = 600; // Adapt image size for legacy clients
                    let img = `<img src="${reader.result}" width="${legacyImageSize}" />`;
                    chatMessageHandler.sendCustomChatMessage(img, currentUser);
                };
            }
        }
    }, [chatMessageHandler, currentUser]);

    function sendGif(gif: GifResult): void {
        setGifSearchAvailable(true);
        invoke('convert_url_to_base64', { url: gif.media[0].nanomp4.url }).then((result) => {
            chatMessageHandler.sendCustomChatMessage(`<video autoplay src="${result}" width="${gif.media[0].gif.dims[0]}" />`, currentUser);
            setGifSearchAvailable(false);
            setShowGifSearch(false);
        });
    }

    function handleInput(e: FormEvent<HTMLDivElement>): void {
        const dataTransfer = e.nativeEvent.dataTransfer;
        if (dataTransfer && dataTransfer.files.length > 0) {
            const file = dataTransfer.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
                if (reader.result && (reader.result as string).length > 0x7fffff) {
                    chatMessageHandler.sendCustomChatMessage(t("Image too large", { size: formatBytes((reader.result as string).length), maximum: formatBytes(0x7fffff) }), currentUser);
                    return;
                }
                const legacyImageSize = 600; // Adapt image size for legacy clients
                let img = `<img src="${reader.result}" width="${legacyImageSize}" />`;
                chatMessageHandler.sendCustomChatMessage(img, currentUser);
            };
        }
    }

    const placeholderText = currentChannel?.length ?? 0 > 100 ? `${currentChannel?.slice(0, 97) ?? ""}...` : currentChannel;

    return (
        <Box m={2} sx={{ display: 'flex' }}>
            <Paper
                component="form"
                sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400, flexGrow: 1 }}
            >
                <Tooltip title={t("Delete all messages", { ns: "user_interaction" })}>
                    <IconButton sx={{ p: '10px' }} aria-label="menu" onClick={showDeleteMessageConfirmationDialog}>
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
                <InputBase
                    sx={{ ml: 1, flex: 1 }}
                    placeholder={t("Send Message to Channel", { ns: "user_interaction", channel: placeholderText })}
                    inputProps={{ 'aria-label': 'Send Message to ' + currentChannel }}
                    onChange={e => setChatMessage(e.target.value)}
                    onKeyDown={keyDownHandler}
                    onInput={(e) => handleInput(e)}
                    value={chatMessage}
                    onPaste={pasteEvent}
                    multiline
                />
                <IconButton onClick={showGifPreview}>
                    <GifIcon />
                </IconButton>
                <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                <IconButton ref={sendElementRef} sx={{ p: '10px' }} aria-label="Send Message" onClick={() => chatMessageHandler.sendChatMessage(chatMessage, currentUser)}>
                    <SendIcon />
                </IconButton>
            </Paper>
            <GifSearch open={showGifSearch} anchor={gifSearchAnchor} onGifSelected={(gif) => sendGif(gif)} ready={gifSearchAvailable} />
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
            <ContextMenu element={sendElementRef} options={[copy, paste, pasteAndSend]} />
        </Box>
    )
}

export default ChatInput;