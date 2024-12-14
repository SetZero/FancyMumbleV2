import { ContentCopy, ContentPaste, Gif } from '@mui/icons-material';
import { Box, Divider, ListItemIcon, ListItemText, MenuItem, MenuList, Paper, Typography } from '@mui/material';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import ContextMenuOptions from './ContextMenuOptions';

interface ContextMenuProps {
    options: ContextMenuOptions[];
    element: RefObject<HTMLElement>;
}

const ContextMenu: React.FC<ContextMenuProps> = React.memo(({ options, element }) => {
    const constexMenuMaxLength = 300;

    const contextRef = useRef<HTMLDivElement>(null);
    const [contextMenuInfo, setContextMenuInfo] = useState({
        posX: 0,
        posY: 0,
        selectedText: "",
        selectedElement: null as HTMLElement | null,
        show: false
    });

    const handleElementClick = (event: React.MouseEvent<HTMLElement>, handler: (event: React.MouseEvent<HTMLElement>) => void) => {
        event.preventDefault();
        handler(event);
        setContextMenuInfo({ ...contextMenuInfo, show: false });
    };


    useEffect(() => {
        const contextMenuEventHandler = (e: MouseEvent) => {
            e.preventDefault();
            const selectedText = window.getSelection()?.toString();
            const selectedElement = e.target as HTMLElement;
            setContextMenuInfo({ posX: e.pageX, posY: e.pageY, selectedText: selectedText ?? "", selectedElement, show: true });
        }

        const offClickHandler = (event: MouseEvent) => {
            if (contextRef.current && !contextRef.current.contains(event.target as Node)) {
                setContextMenuInfo({ ...contextMenuInfo, show: false })
            }
        }

        element.current?.addEventListener('contextmenu', contextMenuEventHandler);
        document.addEventListener('click', offClickHandler);
        return () => {
            element.current?.removeEventListener('contextmenu', contextMenuEventHandler);
            document.removeEventListener('click', offClickHandler);
        }
    }, [contextRef]);

    let { posX: left, posY: top, selectedText, selectedElement, show } = contextMenuInfo;

    return (
        <Box
            ref={contextRef}
            style={{
                position: 'absolute',
                top: `${top > window.innerHeight - window.innerHeight * 0.1 ? top - window.innerHeight * 0.1 : top}px`,
                left: `${left > window.innerWidth - constexMenuMaxLength ? left - constexMenuMaxLength : left}px`,
                display: show ? 'block' : 'none',
            }}>
            <Paper sx={{ width: constexMenuMaxLength }}>
                <MenuList>
                    {options.map((option, index) => (
                        <MenuItem key={index} onClick={(e) => handleElementClick(e, option.handler)}>
                            <ListItemIcon>
                                {option.icon}
                            </ListItemIcon>
                            <ListItemText sx={{ marginRight: 2 }}>{option.label}</ListItemText>
                            <Typography variant="body2" color="text.secondary">
                                {option.shortcut}
                            </Typography>
                        </MenuItem>
                    ))}
                </MenuList>
            </Paper>
        </Box>
    );
});

export default ContextMenu;