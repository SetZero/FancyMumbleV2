import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { WebRTCViewer } from "../helper/webrtc/WebRTC";

interface WebRTCPreviewProps {
    webRtcViewer: WebRTCViewer | undefined;
    showWebRtcWindow: boolean;
}

const WebRTCPreview: React.FC<WebRTCPreviewProps> = ({
    webRtcViewer,
    showWebRtcWindow,
}) => {
    const streamElementRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (showWebRtcWindow && webRtcViewer) {
            webRtcViewer.onStream((stream) => {
                if (streamElementRef.current) {
                    streamElementRef.current.srcObject = stream;
                }
            });
        }
    }, [showWebRtcWindow, webRtcViewer]);

    if (!showWebRtcWindow) {
        return null;
    }

    return (
        <Box sx={{ overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <video ref={streamElementRef} autoPlay playsInline controls />
        </Box>
    );
};

export default WebRTCPreview;