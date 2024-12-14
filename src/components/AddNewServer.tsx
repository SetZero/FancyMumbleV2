import { LoadingButton } from "@mui/lab";
import { Alert, Autocomplete, Box, Button, ButtonGroup, Container, Grid, IconButton, MenuItem, Select, TextField, Tooltip, createFilterOptions } from "@mui/material";
import { t } from "i18next";
import { useMemo, useState } from "react";
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import SendIcon from '@mui/icons-material/Send';
import { useTranslation } from "react-i18next";

interface ServerInfoText {
    show: boolean;
    text: string;
}

export interface ServerInfo {
    description: string;
    server: string;
    port: string;
    username: string;
    identity?: string;
}

interface AddNewServerProps {
    serverInfo: ServerInfoText;
    identityCerts: string[];
    onSave?: (serverInfo: ServerInfo) => Promise<void>;
    onConnect?: (serverInfo: ServerInfo) => Promise<void>;
}

interface IdentitySelectionType {
    inputValue?: string;
    name: string;
}

const filter = createFilterOptions<IdentitySelectionType>();

function AddNewServer({ serverInfo, identityCerts, onSave, onConnect }: Readonly<AddNewServerProps>) {
    let serverAddInfoBoxBox = serverInfo.show ? (<Box mb={3} mt={-2}><Alert severity="info">{serverInfo.text}</Alert></Box>) : (<div></div>);
    const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [identity, setIdentity] = useState<IdentitySelectionType | null>({ name: identityCerts.at(0) ?? "" });
    const [description, setDescription] = useState("Magical Rocks");
    const [server, setServer] = useState("magical.rocks");
    const [port, setPort] = useState("64738");
    const [username, setUsername] = useState("Endor");
    const [t, i18n] = useTranslation();

    let identityCertsObj = identityCerts.map(e => { return { name: e } });

    let additionalOptions = useMemo(() => {

        if (showAdditionalOptions) {
            return (
                <Grid item={true} xs={12}>
                    <Box mt={2}>
                        <Autocomplete
                            value={identity}
                            onChange={(event, newValue: string | IdentitySelectionType | null) => {
                                if (typeof newValue === 'string') {
                                    setIdentity({
                                        name: newValue,
                                    });
                                } else if (newValue?.inputValue) {
                                    // Create a new value from the user input
                                    setIdentity({
                                        name: newValue.inputValue,
                                    });
                                } else {
                                    setIdentity(newValue);
                                }
                            }}
                            filterOptions={(options, params) => {
                                if (typeof options !== 'string') {
                                    const filtered = filter(options as IdentitySelectionType[], params);

                                    const { inputValue } = params;
                                    // Suggest the creation of a new value
                                    const isExisting = options.some((option) => typeof option !== 'string' && inputValue === option?.name);
                                    if (inputValue !== '' && !isExisting) {
                                        filtered.push({
                                            inputValue,
                                            name: `Add "${inputValue}"`,
                                        });
                                    }

                                    return filtered;
                                } else {
                                    return [];
                                }
                            }}
                            selectOnFocus
                            clearOnBlur
                            handleHomeEndKeys
                            id="free-solo-with-text-demo"
                            options={identityCertsObj}
                            getOptionLabel={(option: string | IdentitySelectionType) => {
                                // Value selected with enter, right from the input
                                if (typeof option === 'string') {
                                    return option;
                                }
                                // Add "xxx" option created dynamically
                                if (option.inputValue) {
                                    return option.inputValue;
                                }
                                // Regular option
                                return option.name;
                            }}
                            renderOption={(props, option) => <li {...props}>{typeof option === 'string' ? option : option.name}</li>}
                            freeSolo
                            renderInput={(params) => (
                                <TextField {...params} label={t("Client Certitcate")} />
                            )}
                            fullWidth
                        />
                    </Box>
                </Grid>
            )
        }
        return null;
    }, [showAdditionalOptions, identity]);

    function saveServerOrConnect(isConnect: boolean) {
        setSaving(true);

        const action = isConnect ? onConnect : onSave;

        if (!action) {
            return;
        }

        action({ description, server, port, username, identity: identity?.name }).then(() => {
            // Do nothing
        }).finally(() => {
            setSaving(false);
        });
    }

    function saveServer() {
        saveServerOrConnect(false);
    }

    function connect() {
        saveServerOrConnect(true);
    }

    return (
        <Box>
            {serverAddInfoBoxBox}
            <Container className='login-form'>
                <Grid container spacing={1}>
                    <Grid item={true} xs={12}>
                        <TextField fullWidth label={t("Description")} value={description} onChange={e => setDescription(e.target.value)} />
                    </Grid>
                    <Grid item={true} xs={8} mt={2}>
                        <Box mr={2} mb={2}>
                            <TextField fullWidth label={t("Server")} value={server} onChange={e => setServer(e.target.value)} />
                        </Box>
                    </Grid>
                    <Grid item={true} xs={4} mt={2}>
                        <TextField fullWidth label={t("Port")} value={port} onChange={e => setPort(e.target.value)} />
                    </Grid>
                    <Grid item={true} xs={12}>
                        <TextField fullWidth label={t("Username")} value={username} onChange={e => setUsername(e.target.value)} />
                    </Grid>
                    {additionalOptions}
                    <Grid item={true} xs={6} container justifyContent="flex-start">
                        <Box mt={2}>
                            <LoadingButton loading={saving} variant="contained" onClick={saveServer}>{t('Save', { ns: "user_interaction" })}</LoadingButton >
                        </Box>
                    </Grid>
                    <Grid item={true} xs={6} container justifyContent="flex-end">
                        <Box mt={2}>
                            <Tooltip title="More Options">
                                <IconButton color="primary" onClick={e => setShowAdditionalOptions(!showAdditionalOptions)} >
                                    <UnfoldMoreIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <Box mt={2}>
                            <LoadingButton loading={saving} variant="outlined" onClick={connect} endIcon={<SendIcon />}>{t('Connect', { ns: "user_interaction" })}</LoadingButton >
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

export default AddNewServer;