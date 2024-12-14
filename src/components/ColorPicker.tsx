import { Box, Button, IconButton, InputBase, Paper, Popover, Typography } from '@mui/material';
import React from 'react';
import { ColorResult, CustomPicker, HuePickerProps } from 'react-color';
import Hue from 'react-color/lib/components/hue/Hue';
import { Saturation } from 'react-color/lib/components/common'
import tinycolor from 'tinycolor2';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import ColorLensIcon from '@mui/icons-material/ColorLens';

interface ColorPickerProps extends HuePickerProps {
    description?: string;
    style?: React.CSSProperties;
    color: any;
}

function CustomPointer(): React.ReactNode {
    return (<Box sx={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        transform: 'translate(-9px, -1px)',
        backgroundColor: 'rgba(248, 248, 248, 0.5)',
        boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.37)',
        border: '1px solid #fff'
    }} />)
}

function CustomSlider() {
    return (<Box sx={{
        marginTop: '1px',
        width: '4px',
        borderRadius: '1px',
        height: '8px',
        boxShadow: '0 0 2px rgba(0, 0, 0, .6)',
        background: '#fff',
        transform: 'translateX(-2px)'
    }} />)
}

function DefaultColorPicker(props: ColorPickerProps) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

    const [colorState, setColorState] = React.useState({
        hsl: {
            h: 0,
            s: 0,
            l: 0
        },
        hsv: {
            h: 0,
            s: 0,
            v: 0
        },
        hex: 'aaaaaa'
    });
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleHueChange = (hue: any) => {
        setColorState({
            hsl: hue.hsl,
            hsv: hue.hsv,
            hex: hue.hex
        });

    }

    const handleSaturationChange = (hsv: any) => {
        const color = tinycolor(hsv);
        setColorState({
            hsl: color.toHsl(),
            hsv: color.toHsv(),
            hex: '#' + color.toHex()
        });
        if(props.onChangeComplete)
           props.onChangeComplete(colorState as any, event as any)
    }

    const handleChangeComplete = (hue: ColorResult, event: React.ChangeEvent<HTMLInputElement>) => {
        handleHueChange(hue);
        if(props.onChangeComplete)
           props.onChangeComplete(colorState as any, event as any)
    }

    const showDescription = () => {
        if (props.description) {
            return (
                <Typography variant="caption" display="block" gutterBottom>
                    {props.description}
                </Typography>
            )
        }
    }

    return (<Box sx={{
        width: 40,
        display: 'flex',
        alignItems: 'center',
    }}
    style={props.style}>
        <Box>
            <Button aria-describedby={id} variant="contained" onClick={handleClick} style={{
                backgroundColor: colorState.hex,
                minWidth: 0,
                padding: 0,
                margin: 0,
                height: 40,
                width: '100%',
                justifyContent: 'flex-end',
                alignItems: 'flex-start'
            }}>
                <FormatPaintIcon fontSize="small" />
            </Button>
            {showDescription()}
        </Box>
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
        >
            <Box sx={{
                boxShadow: 'rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px',
                display: 'flex',
                flexDirection: 'column',
                padding: 2,
                maxWidth: 200,
            }}>
                <Box sx={{
                    width: '100%',
                    paddingBottom: '75%',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '4px',
                }}>
                    <Saturation
                        {...(props as any)}
                        onChange={handleSaturationChange}
                    />
                </Box>
                <Box sx={{
                    minHeight: 10, position: 'relative', marginTop: 2, marginBottom: 2, width: 200
                }}>
                    <Hue
                        {...props}
                        width="200"
                        onChange={handleChangeComplete}
                    />
                </Box>
                <Box>
                    <Paper
                        component="form"
                        sx={{ p: '2px 4px', display: 'flex', alignItems: 'center' }}
                    >
                        <IconButton sx={{ p: '10px' }} aria-label="menu">
                            <ColorLensIcon />
                        </IconButton>
                        <InputBase
                            sx={{ ml: 1, flex: 1 }}
                            placeholder="color"
                            inputProps={{ 'aria-label': 'search google maps' }}
                            value={colorState.hex}
                        />
                    </Paper>
                </Box>
            </Box>
        </Popover>
    </Box>);

}

export default CustomPicker(DefaultColorPicker);