import React, { useEffect, useState } from 'react'
import '../App.css';
import './styles/Login.css';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Box, IconButton, LinearProgress, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, MenuItem, Typography, Menu } from '@mui/material';
import { invoke } from '@tauri-apps/api/core'
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import StorageIcon from '@mui/icons-material/Storage';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';
import AddNewServer, { ServerInfo } from '../components/AddNewServer';


interface ServerEntry {
    description: string,
    host: string,
    port: number,
    username: string,
    identity?: string
}

function Login() {

    const userInfo = useSelector((state: RootState) => state.reducer.userInfo);
    const [expanded, setExpanded] = React.useState<string | false>('panel1');

    const [identityCerts, setIdentityCerts] = useState(new Array<string>());
    const [connecting, setConnecting] = useState(false);
    const [errorInfo, setErrorInfo] = useState({ show: false, text: "" });
    const [serverInfo, setServerInfo] = useState({ show: false, text: "" });
    const [languageMenuAnchorEl, setLanguageMenuAnchorEl] = React.useState<null | HTMLElement>(null);
    const languageMenuOpen = Boolean(languageMenuAnchorEl);

    const [serverList, setServerList] = useState<ServerEntry[]>([]);

    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    useEffect(() => {
        console.log("effect: " + location.pathname);
        switch (location.pathname) {
            case "/":
                console.log("logout triggered");
                dispatch({ type: "logout" });
                break;
            default:
                break;
        }
    }, [location]);

    useEffect(() => {
        invoke('get_server_list').then((e: any) => {
            setServerList(e);
        }).catch(e => {
            console.log("error getting server list: ", e);
        });

        invoke('get_identity_certs').then((e: any) => {
            console.log("identity certs: ", e);
            setIdentityCerts(e);
        });
    }, []);

    //TODO: We shouldn't just have a binary connected state,
    //TODO: but a state that can have multiple values, like "connecting",
    //TODO: "connected", "disconnected", "error"
    if (userInfo.connected) {
        console.log("connected");
        navigate("/chat");
    }

    function connect(serverHost: string, serverPort: number, serverUsername: string, identity?: string): Promise<void> {
        console.log("connecting to server: ", serverHost, serverPort, serverUsername);
        setConnecting(true);
        setErrorInfo({ show: false, text: "" });

        return new Promise<void>((resolve, reject) => {
            invoke('connect_to_server', { serverHost: serverHost, serverPort: serverPort, username: serverUsername, identity: identity }).then(e => {
                setConnecting(false);
                resolve();
            }).catch(e => {
                setErrorInfo({ show: true, text: e });
                setConnecting(false);
                reject(new Error("error connecting to server"));
            });
        });
    }

    function saveServer(serverInfo: ServerInfo): Promise<void> {
        setErrorInfo({ show: false, text: "" });
        setServerInfo({ show: false, text: "" });
        return new Promise<void>((resolve, reject) => {

            invoke('save_server', { description: serverInfo.description, serverHost: serverInfo.server, serverPort: parseInt(serverInfo.port), username: serverInfo.username, identity: serverInfo.identity }).then(e => {
                setServerInfo({ show: true, text: "Server saved" });
                setServerList([...serverList, { description: serverInfo.description, host: serverInfo.server, port: parseInt(serverInfo.port), username: serverInfo.username, identity: serverInfo.identity }]);
                resolve();
            }).catch(e => {
                console.log("error saving server: ", e);
                setErrorInfo({ show: true, text: e });
                reject(new Error("error saving server"));
            })
        });
    }

    const handleChange =
        (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
            setExpanded(newExpanded ? panel : false);
        };

    let errorBox = errorInfo.show ? (<Box mb={3}><Alert severity="error">{errorInfo.text}</Alert></Box>) : (<div></div>);
    let connectionLoading = connecting ? (<LinearProgress />) : (<div></div>);

    return (
        <Box sx={{ height: '100%', display: 'flex', maxHeight: '100%', overflow: 'hidden' }}>
            <Box className='login' sx={{ height: '100%', maxWidth: '40%', minWidth: '500px', marginLeft: 2, '@media (max-width: 600px)': { maxWidth: '100%', minWidth: '100px' } }}>
                <Box sx={{ flexGrow: 1, alignContent: "center", justifyContent: "center", display: "flex", flexDirection: "column" }}>
                    <Typography
                        align='center'
                        variant='h3'
                        gutterBottom
                        sx={{
                            fontFamily: 'Comfortaa',
                            fontWeight: 'bold',
                            background: '-webkit-linear-gradient(right, #667db6, #0082c8, #0082c8, #667db6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                        {t('Fancy Mumble Title')}
                    </Typography >
                    {errorBox}
                    <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
                        <AccordionSummary aria-controls="panel2d-content" id="panel2d-header">
                            <Typography>{t('User Profiles')}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {connectionLoading}
                            <List>
                                {serverList.map((e) => {
                                    return (
                                        <ListItem disablePadding key={(e.host || '') + (e.port || '') + (e.username || '')}>
                                            <ListItemButton onClick={() => connect(e.host, e.port, e.username, e.identity)}>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <StorageIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText primary={e.description} />
                                            </ListItemButton>
                                        </ListItem>)
                                })}
                            </List>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                        <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">{t('Add New Server')}</AccordionSummary>
                        <AccordionDetails>
                            <AddNewServer
                                serverInfo={serverInfo}
                                identityCerts={identityCerts}
                                onSave={(serverInfo) => saveServer(serverInfo)}
                                onConnect={(serverInfo) => connect(serverInfo.server, parseInt(serverInfo.port), serverInfo.username, serverInfo.identity)}
                            />
                        </AccordionDetails>
                    </Accordion>
                </Box>
                <Box>
                    <IconButton onClick={(event) => setLanguageMenuAnchorEl(event.currentTarget)}>
                        <LanguageIcon />
                    </IconButton>
                    <Menu
                        id="basic-menu"
                        anchorEl={languageMenuAnchorEl}
                        open={languageMenuOpen}
                        onClose={() => setLanguageMenuAnchorEl(null)}
                        MenuListProps={{
                            'aria-labelledby': 'basic-button',
                        }}
                    >
                        {i18n.languages.map((e) => {
                            return (<MenuItem key={e} onClick={() => {
                                i18n.changeLanguage(e);
                                setLanguageMenuAnchorEl(null)
                            }}>
                                {t(e)}
                            </MenuItem>)

                        })}
                    </Menu>
                </Box>
            </Box>
            <Box sx={{ flexGrow: 1, backgroundImage: 'url(' + window.location.origin + '/login_bg.png)', backgroundSize: 'cover', margin: 2, borderRadius: 7 }}>
            </Box>
        </Box>
    )
}

export default Login
