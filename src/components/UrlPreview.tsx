import { Box, Button, Card, CardActionArea, CardActions, CardContent, CardMedia, Link, Typography } from "@mui/material";
import "./styles/UserInfo.css";
import "./styles/common.css"
import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core"
import { openInBrowser } from "../helper/BrowserUtils";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

interface UrlPreviewProps {
    href: string;
    onLoaded?: () => void;
}


interface UrlPreviewData {
    title: string,
    description: string,
    image: string
}

function UrlPreview(props: UrlPreviewProps) {

    let [urlPreviewData, setUrlPreviewData] = useState<UrlPreviewData | undefined>(undefined);
    const linkPreview = useSelector((state: RootState) => state.reducer.frontendSettings).link_preview;

    const random_rgba = () => {
        var o = Math.round, r = Math.random, s = 255;
        return 'rgba(' + o(r() * s) + ',' + o(r() * s) + ',' + o(r() * s) + ',' + r().toFixed(1) + ')';
    }

    useEffect(() => {
        if (!linkPreview?.enabled) return;
        if (!linkPreview.allow_all && !linkPreview.urls.some(v => {
            let url = new URL(props.href);
            return url.hostname.endsWith(v);
        })) return;
        console.log("fetching url preview data for: ", props.href)

        invoke<string>('get_open_graph_data_from_website', { url: props.href }).then((data) => {
            setUrlPreviewData(JSON.parse(data));
            props.onLoaded?.();
        });
    }, []);

    const cardMedia = useMemo(() => {
        if (urlPreviewData?.image) {
            return (
                <CardMedia
                    component="img"
                    height="140"
                    image={urlPreviewData.image}
                    alt={urlPreviewData.title}
                />
            )
        } else {
            return (<Box height="140" sx={{ backgroundColor: random_rgba() }}></Box>);
        }
    }, [urlPreviewData?.image]);

    const createOpenGraphData = useMemo(() => {
        console.log(urlPreviewData);
        if (urlPreviewData && (urlPreviewData.title || urlPreviewData.description)) {
            return (
                <Card sx={{ maxWidth: 345 }}>
                    <CardActionArea onClick={(e) => {
                        e.preventDefault();
                        openInBrowser(props.href);
                    }}>
                        {cardMedia}
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                {urlPreviewData.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {urlPreviewData.description}
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                    <CardActions>
                        <Button size="small" color="primary" href={props.href} target="_blank" sx={{ fontSize: 9, textTransform: 'lowercase' }}>
                            {props.href}
                        </Button>
                    </CardActions>
                </Card>
            )
        } else {
            return (
                <Box>
                    <Link href={props.href} target="_blank">{props.href}</Link>
                </Box>
            );
        }
    }, [urlPreviewData]);

    return (
        <Box>
            {createOpenGraphData}
        </Box>
    );
}

export default UrlPreview;