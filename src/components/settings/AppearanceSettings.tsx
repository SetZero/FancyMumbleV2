import { Box, CircularProgress, Container, Divider, Typography, } from "@mui/material";
import { useDispatch } from "react-redux";
import './styles/Profile.css'
import { useTranslation } from "react-i18next";
import UploadBox from "../UploadBox";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import React from "react";

enum ImageType {
    Profile = 'profile',
    Background = 'background'
}

function AppearanceSettings() {
    const dispatch = useDispatch();
    const [t] = useTranslation();

    let [loading, setLoading] = useState(false);
    const [uploadBox, setUploadBox] = React.useState(false);
    const [uploadBoxPath, setUploadBoxPath] = React.useState("");
    const [uploadBoxBase64, setUploadBoxBase64] = React.useState("");
    const [uploadBoxType, setUploadBoxType] = React.useState(ImageType.Profile);
    const [aspect, setAspect] = React.useState(1);
    const [shape, setShape] = React.useState<"rect" | "round">("rect");

    function displayLoadingText(text: string) {
        if (loading) {
            return (<CircularProgress />)
        } else {
            return (<Typography>{text}</Typography>)
        }
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
            <Container className="settingsContainer">
                <Typography variant="h4">{t("Appearance", { ns: "appearance" })}</Typography>
                <Divider sx={{ marginBottom: 5 }} />
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignContent: 'center',
                    maxWidth: '100%'
                }}>
                    <UploadBox onUpload={(path) => showUploadBox(path, ImageType.Background, 3 / 1, "rect")}>{displayLoadingText(t("Background Image", { ns: "appearance" }))}</UploadBox>
                </Box>
            </Container>
        </Box >
    )
}

export default AppearanceSettings;