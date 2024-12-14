import { Alert, Backdrop, Box, Card, CardContent, CircularProgress, Container, Divider, Grid, TextField, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import UploadBox from "../UploadBox";
import React, { useState } from 'react';
import DefaultColorPicker from "../ColorPicker";
import { ColorResult } from "react-color";
import UserInfo from "../UserInfo";
import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { UpdateableUserState, UsersState, updateUserSettings } from "../../store/features/users/userSlice";
import { encodeUserCommentData } from "../../helper/ProfileDataHelper";
import { useTheme } from '@mui/material/styles';
import './styles/Profile.css'
import FloatingApply from "./components/FloatingApply";
import ImageCrop from "./components/ImageCrop";
import { Area } from "react-easy-crop";
import { useTranslation } from "react-i18next";

enum ImageType {
    Profile = 'profile',
    Background = 'background'
}

function Profile() {
    const theme = useTheme();
    const dispatch = useDispatch();
    const [t, i18n] = useTranslation();

    const userInfo = useSelector((state: RootState) => state.reducer.userInfo).currentUser;
    const [uploadBox, setUploadBox] = React.useState(false);
    const [uploadBoxPath, setUploadBoxPath] = React.useState("");
    const [uploadBoxBase64, setUploadBoxBase64] = React.useState("");
    const [uploadBoxType, setUploadBoxType] = React.useState(ImageType.Profile);
    const [aspect, setAspect] = React.useState(1);
    const [shape, setShape] = React.useState<"rect" | "round">("rect");


    let [errorMessage, setErrorMessage] = useState('');
    let [loading, setLoading] = useState(false);
    const [primaryColor, setPrimaryColor] = React.useState({
        hex: '#ffffff'
    })
    const [accentColor, setAccentColor] = React.useState({
        hex: '#ffffff'
    })

    function showErrorMessage() {
        if (errorMessage) {
            return <Alert severity="error">{errorMessage}</Alert>
        }
    }

    function displayLoadingText(text: string) {
        if (loading) {
            return (<CircularProgress />)
        } else {
            return (<Typography>{text}</Typography>)
        }
    }

    async function updateUserValue(update: (currentUser: UsersState, operator: UpdateableUserState) => void) {
        if (userInfo) {
            let currentUserClone: UpdateableUserState = { id: userInfo.id };

            await update(userInfo, currentUserClone);
            //await invoke('change_user_state', { userState: currentUserClone }).catch(e => console.log(e));
        }
    }

    async function setPrimaryColorCall(color: ColorResult) {
        setPrimaryColor(color);
        if (userInfo) {
            let userData = {
                ...userInfo.commentData,
                settings:
                {
                    ...userInfo.commentData?.settings,
                    primary_color: color.hex
                }
            };

            updateUserValue(async (currentUser, currentUserClone) => {
                let encoded = await encodeUserCommentData(currentUser.comment, userData);
                currentUserClone.comment = encoded;
            });

            dispatch(updateUserSettings({ user_id: userInfo.id, settings: { ...userInfo.commentData?.settings, primary_color: color.hex } }));
        }
    }

    function setAccentColorCall(color: ColorResult) {
        setAccentColor(color);
        if (userInfo) {
            /*let userData = {
                ...userInfo.commentData,
                settings:
                {
                    ...userInfo.commentData?.settings,
                    accentColor: color.hex
                }
            };

            updateUserValue(async (currentUser, currentUserClone) => {
                let encoded = await encodeUserCommentData(currentUser.comment, userData);
                currentUserClone.comment = encoded;
            });*/

            //dispatch(updateUserSettings({ user_id: userInfo.id, settings: { ...userInfo.commentData?.settings, accent_color: color.hex } }));
        }
    }

    async function uploadFile(path: string, type: ImageType) {
        setErrorMessage('');
        setLoading(true);
        invoke('set_user_image', { imagePath: path, imageType: type })
            .catch(e => {
                setErrorMessage(e);
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function imageCropBox() {
        return (<Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={uploadBox}
            onClick={() => { setUploadBox(!uploadBox) }}
        >
            <Card variant="outlined" onClick={(e) => e.stopPropagation()}>
                <CardContent>
                    <ImageCrop
                        image={uploadBoxBase64}
                        onCancel={() => {
                            setUploadBox(false);
                            setUploadBoxBase64("");
                        }}
                        onSkip={() => {
                            uploadFile(uploadBoxPath, uploadBoxType);
                            setUploadBox(false);
                            setUploadBoxBase64("");
                        }}
                        onCrop={(image: string, zoom: number, crop: Area, rotation: number) => {
                            setUploadBox(false);
                            setUploadBoxBase64("");
                            invoke('crop_and_store_image', { path: uploadBoxPath, zoom: zoom, crop: crop, rotation: rotation })
                                .then((path) => {
                                    console.log(path);
                                    uploadFile(path as string, uploadBoxType);
                                })
                                .catch(e => console.log(e));
                        }}
                        aspect={aspect}
                        cropShape={shape} />
                </CardContent>
            </Card>
        </Backdrop>
        )
    }

    function showUploadBox(path: string, type: ImageType, aspect?: number, shape?: "rect" | "round") {
        invoke('convert_to_base64', { path: path }).then(base64 => {
            setUploadBox(true);
            setUploadBoxBase64(base64 as string);
            setUploadBoxPath(path);
            setUploadBoxType(type);
            setAspect(aspect ?? 1);
            setShape(shape ?? "rect");
        })
    }

    return (
        <Box>
            {imageCropBox()}
            <Container className="settingsContainer">
                {showErrorMessage()}
                <Typography variant="h4">Profile</Typography>
                <Divider sx={{ marginBottom: 5 }} />
                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 18 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Grid item xs={12} sm={12} md={6} lg={12} sx={{ padding: 2 }}>
                        <Typography variant="h5">{t("Images")}</Typography>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignContent: 'center',
                            maxWidth: '100%'
                        }}>
                            <UploadBox onUpload={(path) => showUploadBox(path, ImageType.Background, 3 / 1, "rect")}>{displayLoadingText(t("Background Image", { ns: "appearance" }))}</UploadBox>
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignContent: 'center',
                            maxWidth: '100%'
                        }}>
                            <UploadBox onUpload={(path) => showUploadBox(path, ImageType.Profile, 1, "round")}>{displayLoadingText(t("Profile Image", { ns: "appearance" }))}</UploadBox>
                        </Box>
                        <Typography variant="h5" sx={{ marginTop: 4, marginBottom: 1 }}>{t("Colors", { ns: "appearance" })}</Typography>
                        <Box sx={{ display: 'flex' }}>
                            <DefaultColorPicker color={primaryColor} onChangeComplete={(color) => setPrimaryColorCall(color)} description={t("Primary", { ns: "appearance" })} style={{ marginRight: 15 }} />
                            <DefaultColorPicker color={accentColor} onChangeComplete={(color) => setAccentColorCall(color)} description={t("Accent", { ns: "appearance" })} style={{ marginRight: 15 }} />
                        </Box>
                        <Typography variant="h5" sx={{ marginTop: 4, marginBottom: 1 }}>{t("About Me")}</Typography>
                        <Box sx={{ display: 'flex' }}>
                            <TextField
                                placeholder={t("Tell us about yourself")}
                                rows={4}
                                multiline
                                sx={{ flexGrow: 1, marginRight: 2 }}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} lg={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <UserInfo
                            userInfo={userInfo}
                            style={{ position: 'sticky', top: theme.spacing(2) }}
                        />
                    </Grid>
                </Grid>
            </Container >
            <FloatingApply discardText={t("Discard", { ns: "user_interaction" })} saveText={t("Save", { ns: "user_interaction" })} onDiscard={() => { }} onSave={() => { }} />
        </Box >
    )
}

export default Profile;