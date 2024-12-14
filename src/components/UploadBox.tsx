import { Box } from "@mui/material";
import { open } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import './styles/UploadBox.css'
import { useEffect, useState } from "react";

interface UploadBoxProps {
    onUpload: (path: string) => void;
    children: React.ReactNode;
}

function UploadBox(props: UploadBoxProps) {
    let [elHover, setElHover] = useState(false);

    /*useEffect(() => {
        const unlisten = listen('tauri://file-drop', async event => {
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log(event);
            //TODO: We don't know what element was clicked, so we can't use the event data
            //TODO: Also this event is triggered n times (once for each component that listens to it)
        });

        return () => {
            unlisten.then(f => f());
          }
    });*/

    async function clickHandler() {
        let selected = await open({
            multiple: false,
            filters: [{
                name: 'Image',
                extensions: ['png', 'jpeg', 'gif', 'webp', 'jpg']
            }]
        });
        if (!selected || Array.isArray(selected)) return;

        props.onUpload(selected.base64Data ?? '');
    }

    async function handleDropUpload() {

    }

    return (
        <Box
            onClick={() => clickHandler()}
            onDrop={() => handleDropUpload()}
            onMouseEnter={() => setElHover(true)}
            onMouseLeave={() => setElHover(false)}
            className={"upload-box " + (elHover ? "hovered" : "")}
        >
            {props.children}
        </Box>
    )
}
export default UploadBox;