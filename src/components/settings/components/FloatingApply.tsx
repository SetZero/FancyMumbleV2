import React, { FC, MouseEventHandler } from 'react';
import { Box, Paper, Button, useTheme } from '@mui/material';

interface FloatingApplyProps {
  discardText: string;
  saveText: string;
  onDiscard: MouseEventHandler<HTMLButtonElement>;
  onSave: MouseEventHandler<HTMLButtonElement>;
}

const FloatingApply: FC<FloatingApplyProps> = ({ discardText, saveText, onDiscard, onSave, ...props }) => (
  <Box sx={{
    position: 'sticky', bottom:
      useTheme().spacing(2), display: 'flex', justifyContent: 'center'
  }} {...props}>
    <Paper sx={{ maxWidth: '600px', padding: 2, display: "flex", justifyContent: "end", margin: 2, borderRadius: 2, flexGrow: 1 }}>
      <Box sx={{ marginRight: 2 }}>
        <Button color="error" size="small" onClick={onDiscard}>{discardText}</Button>
      </Box>
      <Box>
        <Button variant="contained" size="small" onClick={onSave}>{saveText}</Button>
      </Box>
    </Paper>
  </Box>
);

export default FloatingApply;