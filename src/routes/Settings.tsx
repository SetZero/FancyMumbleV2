import { Box, Button, Divider, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PersonIcon from '@mui/icons-material/Person';
import KeyIcon from '@mui/icons-material/Key';
import SecurityIcon from '@mui/icons-material/Security';
import Profile from "../components/settings/Profile";
import AudioSettings from "../components/settings/Audio";
import AdditionalFeatures from "../components/settings/AdditionalFeatures";
import AodIcon from '@mui/icons-material/Aod';
import NotificationsIcon from '@mui/icons-material/Notifications';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import AdvancedSettings from "../components/settings/AdvancedSettings";
import LanguageSettings from "../components/settings/LanguageSettings";
import LanguageIcon from '@mui/icons-material/Language';
import AppearanceSettings from "../components/settings/AppearanceSettings";
import { useTranslation } from "react-i18next";

enum SettingsTab {
    Profile = 0,
    Audio = 1,
    AdditionalFeatures = 2,
    Privacy = 3,
    Appearance = 4,
    Notifications = 5,
    Hotkeys = 6,
    Advanced = 7,
    Language = 8
}

function Settings() {
    const navigate = useNavigate();
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [t, i18n] = useTranslation();

    return (
        <Box sx={{ height: '100%', display: 'flex' }}>
            <Box sx={{ width: '100%', maxWidth: 200, bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    <List component="nav" aria-label="main mailbox folders" subheader={<ListSubheader>{t('Settings')}</ListSubheader>}>
                        <ListItemButton
                            selected={selectedIndex === SettingsTab.Profile}
                            onClick={() => setSelectedIndex(SettingsTab.Profile)}
                        >
                            <ListItemIcon>
                                <PersonIcon />
                            </ListItemIcon>
                            <ListItemText primary={t("Profile")} />
                        </ListItemButton>
                        <ListItemButton
                            selected={selectedIndex === SettingsTab.Audio}
                            onClick={() => setSelectedIndex(SettingsTab.Audio)}
                        >
                            <ListItemIcon>
                                <VolumeUpIcon />
                            </ListItemIcon>
                            <ListItemText primary={t("Audio", { ns: "audio" })} />
                        </ListItemButton>
                    </List>
                    <Divider />
                    <List component="nav" aria-label="secondary mailbox folder">
                        <ListItemButton
                            selected={selectedIndex === SettingsTab.Appearance}
                            onClick={(event) => setSelectedIndex(SettingsTab.Appearance)}
                        >
                            <ListItemIcon>
                                <AodIcon />
                            </ListItemIcon>
                            <ListItemText primary={t("Appearance", { ns: "appearance" })} />
                        </ListItemButton>
                        <ListItemButton
                            selected={selectedIndex === SettingsTab.Notifications}
                            onClick={(event) => setSelectedIndex(SettingsTab.Notifications)}
                        >
                            <ListItemIcon>
                                <NotificationsIcon />
                            </ListItemIcon>
                            <ListItemText primary={t("Notifications", { ns: "notifications" })} />
                        </ListItemButton>
                        <ListItemButton
                            selected={selectedIndex === SettingsTab.Language}
                            onClick={(event) => setSelectedIndex(SettingsTab.Language)}
                        >
                            <ListItemIcon>
                                <LanguageIcon />
                            </ListItemIcon>
                            <ListItemText primary={t("Language", { ns: "language" })} />
                        </ListItemButton>
                        <ListItemButton
                            selected={selectedIndex === SettingsTab.Hotkeys}
                            onClick={(event) => setSelectedIndex(SettingsTab.Hotkeys)}
                        >
                            <ListItemIcon>
                                <KeyboardIcon />
                            </ListItemIcon>
                            <ListItemText primary={t("Hotkeys", { ns: "notifications" })} />
                        </ListItemButton>
                    </List>
                    <Divider />
                    <List component="nav" aria-label="secondary mailbox folder">
                        <ListItemButton
                            selected={selectedIndex === SettingsTab.AdditionalFeatures}
                            onClick={(event) => setSelectedIndex(SettingsTab.AdditionalFeatures)}
                        >
                            <ListItemIcon>
                                <KeyIcon />
                            </ListItemIcon>
                            <ListItemText primary={t("Additional Features")} />
                        </ListItemButton>
                        <ListItemButton
                            selected={selectedIndex === SettingsTab.Advanced}
                            onClick={(event) => setSelectedIndex(SettingsTab.Advanced)}
                        >
                            <ListItemIcon>
                                <SettingsSuggestIcon />
                            </ListItemIcon>
                            <ListItemText primary={t("Advanced")} />
                        </ListItemButton>
                        <ListItemButton
                            selected={selectedIndex === SettingsTab.Privacy}
                            onClick={(event) => setSelectedIndex(SettingsTab.Privacy)}
                        >
                            <ListItemIcon>
                                <SecurityIcon />
                            </ListItemIcon>
                            <ListItemText primary={t("Privacy", { ns: "privacy" })} />
                        </ListItemButton>
                    </List>
                </Box>
                <Box>
                    <Button onClick={e => navigate("/chat")}>{t('Go Back', { ns: "user_interaction" })}</Button>
                </Box>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Box sx={{ p: 0 }}>
                    {selectedIndex === SettingsTab.Audio && <AudioSettings />}
                    {selectedIndex === SettingsTab.Profile && <Profile />}
                    {selectedIndex === SettingsTab.AdditionalFeatures && <AdditionalFeatures />}
                    {selectedIndex === SettingsTab.Privacy && <div>{t('Privacy', { ns: "privacy" })}</div>}
                    {selectedIndex === SettingsTab.Advanced && <AdvancedSettings />}
                    {selectedIndex === SettingsTab.Language && <LanguageSettings />}
                    {selectedIndex === SettingsTab.Appearance && <AppearanceSettings />}
                </Box>
            </Box>
        </Box>
    )
}

export default Settings;