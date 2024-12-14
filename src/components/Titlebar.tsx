import { getCurrentWindow } from '@tauri-apps/api/window';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import FilterNoneIcon from '@mui/icons-material/FilterNone';
import { IconButton, Paper } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import './styles/Titlebar.css';
function Titlebar() {
    const closeApp = () => {
        invoke('close_app');
    }
    const appWindow = getCurrentWindow();

    return (
        <Paper data-tauri-drag-region sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'end',
            zIndex: 9999,
            userSelect: 'none',
        }}>
            <IconButton size="small" onClick={(e) => appWindow.minimize()} className="titlebar-button" >
                <MinimizeIcon sx={{ fontSize: 18 }} />
            </IconButton >
            <IconButton size="small" onClick={(e) => appWindow.toggleMaximize()} className="titlebar-button">
                <FilterNoneIcon sx={{ fontSize: 18 }} />
            </IconButton >
            <IconButton size="small" onClick={(e) => closeApp()} className="titlebar-button" color="error">
                <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton >
        </Paper>
    )
}

export default Titlebar;