import { FileCopyOutlined } from "@mui/icons-material";
import { invoke } from "@tauri-apps/api/core";

export default interface ContextMenuOptions {
    icon: React.ReactNode;
    label: string;
    shortcut: string;
    handler: (event: React.MouseEvent<HTMLElement>) => void;
}

export const paste = {
    icon: <FileCopyOutlined />,
    label: "Paste",
    shortcut: "Ctrl+V",
    handler: (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        navigator.clipboard.readText().then(clipText => {
            console.log(clipText);
        });
    }
};

export const copy = {
    icon: <FileCopyOutlined />,
    label: "Copy",
    shortcut: "Ctrl+C",
    handler: (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        const selectedElement = event.target as HTMLElement;
        copyElement(selectedElement);
    }
};

export const showDeveloperTools = {
    icon: <FileCopyOutlined />,
    label: "Developer Tools",
    shortcut: "Ctrl+Shift+I",
    handler: (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        invoke("dev_tools");
    }
};


async function copyElement(element: HTMLElement) {
    let clipboardItemData = {};

    if (element instanceof HTMLImageElement) {
        const response = await fetch(element.src);
        const blob = await response.blob();
        clipboardItemData = {
            'image/png': blob
        };
    } else if (element instanceof HTMLVideoElement) {
        const response = await fetch(element.src);
        const blob = await response.blob();
        clipboardItemData = {
            'video/mp4': blob
        };
    } else if (element instanceof HTMLParagraphElement || element instanceof HTMLSpanElement) {
        clipboardItemData = {
            'text/plain': new Blob([element.innerText], { type: 'text/plain' })
        };
    }

    const clipboardItem = new ClipboardItem(clipboardItemData);
    await navigator.clipboard.write([clipboardItem]);
}