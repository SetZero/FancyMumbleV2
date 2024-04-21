import { Box, CircularProgress, Container, Divider, Typography, } from "@mui/material";
import { useDispatch } from "react-redux";
import './styles/Profile.css'
import { useTranslation } from "react-i18next";
import UploadBox from "../UploadBox";
import { useState } from "react";


function AppearanceSettings() {
    const dispatch = useDispatch();
    const [t] = useTranslation();

    let [loading, setLoading] = useState(false);

    function displayLoadingText(text: string) {
        if (loading) {
            return (<CircularProgress />)
        } else {
            return (<Typography>{text}</Typography>)
        }
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