import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Container, Divider, FormControlLabel, FormGroup, Grid, Switch, Typography, } from "@mui/material";
import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from '@mui/material/styles';
import './styles/Profile.css'
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { clearFrontendSettings, updateAdvancedSettings } from "../../store/features/users/frontendSettings";
import { useTranslation } from "react-i18next";
import { persistFrontendSettings, persistentStorage } from "../../store/persistance/persist";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


function AdvancedSettings() {
    const dispatch = useDispatch();
    const [t] = useTranslation();

    let [errorMessage, setErrorMessage] = useState('');
    const frontendSettings = useSelector((state: RootState) => state.reducer.frontendSettings);
    const audioSettings = useSelector((state: RootState) => state.reducer.audioSettings);
    const advancedSettings = frontendSettings.advancedSettings;

    function showErrorMessage() {
        if (errorMessage) {
            return <Alert severity="error">{errorMessage}</Alert>
        }
    }

    async function updateAutoScroll(e: ChangeEvent<HTMLInputElement>) {
        dispatch(updateAdvancedSettings({ ...advancedSettings, disableAutoscroll: e.target.checked }));
    }

    async function updateScrollState(e: ChangeEvent<HTMLInputElement>) {
        dispatch(updateAdvancedSettings({ ...advancedSettings, alwaysScrollDown: e.target.checked }));
    }

    async function updateWYSIWYG(e: ChangeEvent<HTMLInputElement>) {
        dispatch(updateAdvancedSettings({ ...advancedSettings, useWYSIWYG: e.target.checked }));
    }

    const persistData = useCallback(async () => {
        if (advancedSettings) {
            await persistFrontendSettings(frontendSettings);
        }
    }, [advancedSettings])

    useEffect(() => {
        persistData();
    }, [persistData]);

    return (
        <Box>
            <Container className="settingsContainer">
                {showErrorMessage()}
                <Typography variant="h4">{t("Advanced Settings")}</Typography>
                <Box m={2}>
                    <Typography variant="h5">{t("User Interface")}</Typography>
                    <FormGroup>
                        <FormControlLabel control={<Switch value={advancedSettings?.disableAutoscroll} onChange={async (e) => updateAutoScroll(e)} />} label={t("Disable Auto-Scroll", { ns: "appearance" })} />
                        <FormControlLabel control={<Switch value={advancedSettings?.alwaysScrollDown} onChange={async (e) => updateScrollState(e)} disabled={advancedSettings?.disableAutoscroll} />} label={t("Always auto-scroll, even if scrolled up", { ns: "appearance" })} />
                        <FormControlLabel control={<Switch value={advancedSettings?.useWYSIWYG} onChange={async (e) => updateWYSIWYG(e)} />} label={(<Box><Chip label={t("Beta")} color="primary" size="small" />{t("Enable WYSIWYG Editor", { ns: "appearance" })}</Box>)} />
                    </FormGroup>
                </Box>
                <Divider variant="middle" />
                <Box m={2}>
                    <Typography variant="h5" mb={2}>{t("Developer Options")}</Typography>
                    <Accordion defaultExpanded>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1-content"
                            id="panel1-header"
                        >
                            <Typography>{t('Clear All Settings', { ns: "privacy" })}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box>
                                <Typography>
                                    {t('If you are having troubles with your current settings, you can reset them.', { ns: "privacy" })}
                                    {t('Be aware that this will reset ALL of you settings', { ns: "privacy" })}
                                </Typography>
                            </Box>
                            <Button onClick={async () => {
                                dispatch(clearFrontendSettings());
                                const stateClone = {};
                                await persistentStorage.set('frontendSettings', stateClone);
                                await persistentStorage.save();
                            }}>{t('Clear All Settings', { ns: "privacy" })}</Button>
                        </AccordionDetails>
                    </Accordion>
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel2-content"
                            id="panel2-header"
                        >
                            <Typography>{t('Debug Info of Settings', { ns: "privacy" })}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box maxHeight={400} overflow={"auto"}>
                                <pre>{JSON.stringify(frontendSettings, null, 2)}</pre>
                                <pre>{JSON.stringify(audioSettings, null, 2)}</pre>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </Container>
        </Box >
    )
}

export default AdvancedSettings;