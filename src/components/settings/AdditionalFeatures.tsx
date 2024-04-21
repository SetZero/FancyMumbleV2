import { Alert, Box, Button, Container, Divider, Grid, Switch, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { updateApiKey, FrontendSettings, updateFrontendSettings, clearFrontendSettings } from '../../store/features/users/frontendSettings';
import { invoke } from "@tauri-apps/api/core";
import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { t } from 'i18next';
import { persistFrontendSettings, persistentStorage } from '../../store/persistance/persist';


interface AdditionalFeaturesProps {
}

const AdditionalFeatures: React.FC<AdditionalFeaturesProps> = React.memo(({ }) => {
    const frontendSettings = useSelector((state: RootState) => state.reducer.frontendSettings);
    const dispatch = useDispatch();

    let [errorMessage, setErrorMessage] = useState('');
    const label = { inputProps: { 'aria-label': t('Link Preview') } };

    function showErrorMessage() {
        if (errorMessage) {
            return <Alert severity="error">{errorMessage}</Alert>
        }
    }

    async function updateEnabled() {
        await updateLinkPreviewState((state) => {
            console.log(state.link_preview);
            if (state.link_preview && frontendSettings.link_preview) {
                let newState = !frontendSettings.link_preview.enabled;
                state.link_preview.enabled = newState;
            } else {
                state.link_preview = { enabled: true, allow_all: false, urls: [] };
            }

            return state;
        });
    }

    async function updateAllowAll() {
        await updateLinkPreviewState((state) => {
            if (state.link_preview && frontendSettings.link_preview) {
                let newState = !frontendSettings.link_preview.allow_all;
                state.link_preview.allow_all = newState;
            } else {
                state.link_preview = { enabled: true, allow_all: true, urls: [] };
            }

            return state;
        });
    }

    async function updateAllowedUrls(urls: string[]) {
        await updateLinkPreviewState((state) => {
            if (state.link_preview) {
                state.link_preview.urls = urls;
            } else {
                state.link_preview = { enabled: true, allow_all: false, urls: urls };
            }
            return state;
        });
    }

    async function updateTenorApiKey(value: string) {
        await updateLinkPreviewState((state) => {
            if (state.api_keys) {
                state.api_keys.tenor = value;
            } else {
                state.api_keys = { tenor: value };
            }
            return state;
        });
    }

    async function updateLinkPreviewState(stateChangeFunction: (newState: FrontendSettings) => any) {
        let stateClone = JSON.parse(JSON.stringify(frontendSettings));
        stateClone = stateChangeFunction(stateClone);
        await persistFrontendSettings(stateClone).catch((e: any) => {
            setErrorMessage('Failed to save settings: ' + e);
        });

        dispatch(updateFrontendSettings(stateClone));
    }

    function allowAllSetting() {
        if (!frontendSettings.link_preview?.enabled) return (<Box />);

        return (
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 18 }} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                <Grid item xs={4} sm={8} md={6} lg={6}>
                    <Typography variant="h6">{t('Allow URLs from all sources', { ns: "privacy" })}</Typography>
                </Grid>
                <Grid item xs={4} sm={8} md={6} lg={6}>
                    <Switch {...label} checked={frontendSettings.link_preview?.allow_all || false} onChange={async () => await updateAllowAll()} />
                </Grid>
            </Grid>
        )
    }

    function linkPreviewSettings() {
        if (!frontendSettings.link_preview?.enabled || frontendSettings.link_preview?.allow_all) return (<Box />);

        return (
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 18 }} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                <Grid item xs={4} sm={8} md={6} lg={6}>
                    <Typography variant="h6">{t('Allowed Link Preview Urls', { ns: "privacy" })}</Typography>
                </Grid>
                <Grid item xs={4} sm={8} md={6} lg={6}>
                    <TextField {...label} value={frontendSettings.link_preview?.urls.join('\n')} multiline onChange={async (text) => await updateAllowedUrls(text.target.value.split(/\r?\n/))} maxRows={10} />
                </Grid>
            </Grid>
        )
    }

    return (
        <Box>
            <Container className="settingsContainer">
                {showErrorMessage()}
                <Typography variant="h4">{t('Additional Features')}</Typography>
                <Divider sx={{ marginBottom: 5 }} />
                <Box m={2}>
                    <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 18 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Grid item xs={4} sm={8} md={6} lg={6}>
                            <Typography variant="h6">{t('Enable Link Preview', { ns: "privacy" })}</Typography>
                        </Grid>
                        <Grid item xs={4} sm={8} md={6} lg={6}>
                            <Switch {...label} checked={frontendSettings.link_preview?.enabled ?? false} onChange={async () => await updateEnabled()} />
                        </Grid>
                    </Grid>
                    {allowAllSetting()}
                    {linkPreviewSettings()}
                </Box>
                <Divider variant="middle" />
                <Box m={2}>
                    <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 18 }} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                        <Grid item xs={4} sm={8} md={6} lg={6}>
                            <Typography variant="h6">{t('Tenor API Key', { ns: "privacy" })}</Typography>
                        </Grid>
                        <Grid item xs={4} sm={8} md={6} lg={6}>
                            <TextField {...label} value={frontendSettings.api_keys?.tenor} onChange={async (text) => await updateTenorApiKey(text.target.value)} maxRows={10} />
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </Box>
    )
});

export default AdditionalFeatures;