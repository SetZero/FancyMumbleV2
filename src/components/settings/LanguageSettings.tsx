import { Box, Container, FormControlLabel, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Radio, RadioGroup, Typography, } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import './styles/Profile.css'
import { useTranslation } from "react-i18next";
import { RootState } from "../../store/store";
import { setLanguage } from "../../store/features/users/frontendSettings";
import { persistFrontendSettings } from "../../store/persistance/persist";


function LanguageSettings() {
    const dispatch = useDispatch();
    const [t, i18n] = useTranslation();
    let frontendSettings = useSelector((state: RootState) => state.reducer.frontendSettings);
    let userLanguage = frontendSettings?.language?.language;

    let sortedLanguages = [...i18n.languages].sort((a, b) => a.localeCompare(b));

    function updateLanguageSettings(language: string) {
        let newLanguageSettings = { language: language };
        let newFrontendSettings = { ...frontendSettings, language: newLanguageSettings };

        i18n.changeLanguage(language);
        dispatch(setLanguage(newLanguageSettings));
        persistFrontendSettings(newFrontendSettings);
    }

    return (
        <Box>
            <Container className="settingsContainer">
                <Typography variant="h4">{t("Language", { ns: "language" })}</Typography>
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    <RadioGroup
                        aria-labelledby="demo-radio-buttons-group-label"
                        defaultValue="female"
                        name="radio-buttons-group"
                        value={userLanguage}
                        onChange={(e) => updateLanguageSettings(e.target.value)}
                    >
                        {sortedLanguages.map((e) => {
                            return (
                                <ListItem
                                    key={e}
                                    secondaryAction={
                                        <IconButton edge="end" aria-label="comments">

                                        </IconButton>
                                    }
                                    disablePadding
                                >
                                    <ListItemButton role={undefined} onClick={() => updateLanguageSettings(e)} dense>
                                        <ListItemIcon>
                                            <FormControlLabel value={e} control={<Radio />} label={t(e, { ns: "language" })} />
                                        </ListItemIcon>
                                        <ListItemText primary={t(e + " native", { ns: "language" })} />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </RadioGroup>
                </List>
            </Container>
        </Box >
    )
}

export default LanguageSettings;