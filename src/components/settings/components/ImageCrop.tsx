import React, { useState, useCallback } from 'react';
import { Box, Button, Container, IconButton, Slider, Typography } from '@mui/material';
import Cropper, { Area } from 'react-easy-crop';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { useTranslation } from 'react-i18next';

interface ImageCropperProps {
    image: string;
    onSkip: () => void;
    onCrop: (image: string, zoom: number, crop: Area, rotation: number) => void;
    onCancel: () => void;
    aspect?: number;
    cropShape: 'round' | 'rect';
}

const ImageCropper: React.FC<ImageCropperProps> = ({ image, onSkip, onCrop, onCancel, ...props }) => {
    const [t, i18n] = useTranslation();
    const [crop, setCrop] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(1);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [rotation, setRotation] = useState<number>(0);
    const [cropInfo, setCropInfo] = useState({ x: 0, y: 0, width: 0, height: 0 });

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCropInfo(croppedAreaPixels);
    }, []);


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '640px', height: '480px', maxWidth: '100%', maxHeight: '100%', margin: '5px' }}>
            <Box sx={{ mb: 1 }}>
                <Typography variant="h6">{t('Edit Image')}</Typography>
            </Box>
            <Box sx={{ maxWidth: '640px', maxHeight: '480px', position: 'relative', flexGrow: 1, width: '100%' }}>
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    showGrid={false}
                    {...props}
                />
            </Box>
            <Box sx={{ width: '100%', mb: 2 }}>
                <Container sx={{ my: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Slider
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e, zoom) => setZoom(zoom as number)}
                        />
                    </Box>
                    <IconButton color="primary" aria-label="rotate left" onClick={() => setRotation((rotation - 90) % 360)}>
                        <RotateLeftIcon />
                    </IconButton>
                    <IconButton color="primary" aria-label="rotate right" onClick={() => setRotation((rotation + 90) % 360)}>
                        <RotateRightIcon />
                    </IconButton>
                </Container>
            </Box>
            <Box sx={{ display: 'flex', width: '100%' }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Button onClick={onSkip} variant="text" color="info">
                        {t('Skip')}
                    </Button>
                </Box>
                <Box>
                    <Button onClick={onCancel} variant="text" color="error">
                        {t('Cancel')}
                    </Button>
                    <Button onClick={() => onCrop(image, zoom, cropInfo, rotation)} variant="contained" color="primary">
                        {t('Apply')}
                    </Button>
                </Box>
            </Box>
            {croppedImage && (
                <img alt="Cropped" src={croppedImage} />
            )}
        </Box>
    );
};

export default ImageCropper;