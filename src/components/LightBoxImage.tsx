import { Backdrop, Box, Container, Link, Popover, } from "@mui/material";
import { UsersState } from "../store/features/users/userSlice";
import "./styles/UserInfo.css";
import "./styles/common.css"
import UserInfo from "./UserInfo";
import React, { useEffect, useMemo, useState } from "react";
import { openInBrowser } from "../helper/BrowserUtils";
import { useTranslation } from "react-i18next";

interface LightBoxImageProps {
    src: string;
}

function LightBoxImage(props: LightBoxImageProps) {
    const minWidth = 400;
    const minHeight = 400;
    const lightboxRef = React.createRef<HTMLDivElement>();
    const imgRef = React.createRef<HTMLImageElement>();
    const { t, i18n } = useTranslation();
    const [open, setOpen]: any = useState(false);
    const [backgroundImage, setBackgroundImage] = useState<React.CSSProperties>({});

    const handleClose = () => {
        setOpen(false);
    };

    const imageWidth = useMemo(() => {
        if (!imgRef.current) return 0;

        return imgRef.current.offsetWidth;
    }, [imgRef]);

    const imageHeight = useMemo(() => {
        if (!imgRef.current) return 0;

        return imgRef.current.offsetHeight;
    }, [imgRef]);

    useEffect(() => {
        if (!lightboxRef.current) return;

        if (lightboxRef.current.offsetWidth <= minWidth || lightboxRef.current.offsetHeight <= minHeight) {
            let additionalStyles = {};
            if (imageWidth <= imageHeight) {
                additionalStyles = { minWidth: minWidth, height: '100%' };
            } else {
                additionalStyles = { width: '100%', minHeight: minHeight, height: '100%' };
            }

            setBackgroundImage({ backgroundImage: `url(${props.src.replace(/(\r\n|\n|\r|\s)/gm, "")})`, backgroundColor: '#000000', backgroundSize: 'cover', ...additionalStyles });
        }
    }, [lightboxRef.current?.offsetWidth, lightboxRef.current?.offsetHeight, imageHeight, imageWidth]);

    return (
        <Box sx={{ borderRadius: '10px', display: 'flex', cursor: 'pointer', ...backgroundImage }} ref={lightboxRef}>
            <Box onClick={() => setOpen(true)} sx={{ width: '100%', height: '100%', borderRadius: '10px', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'center', alignContent: 'center', alignItems: 'center', flexWrap: 'nowrap', flexDirection: 'column' }}>
                <img ref={imgRef} src={props.src} style={{ maxWidth: '100%', maxHeight: minHeight, borderRadius: '10px' }} alt="" />
            </Box>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, backdropFilter: 'blur(5px)', padding: '50px 10px 10px 10px' }}
                open={open}
                onClick={handleClose}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                    <Box sx={{ flexShrink: 0, display: 'contents' }}>
                        <img src={props.src} style={{ height: 'auto', width: 'auto', maxWidth: '100%', maxHeight: 'calc(100% - 2em)', objectFit: 'contain' }} />
                    </Box>
                    <Box sx={{ flexShrink: 1, textAlign: 'center' }}>
                        <Link href="#" color="inherit" underline="hover" onClick={() => openInBrowser(props.src)}>{t('Open In Browser')}</Link>
                    </Box>
                </Box>
            </Backdrop>
        </Box>
    );
}

export default LightBoxImage;