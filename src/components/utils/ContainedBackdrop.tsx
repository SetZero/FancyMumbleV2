import { Backdrop, Box, CircularProgress } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles({
    parent: {
        position: "relative",
        zIndex: 0,
    },
    backdrop: {
        position: "absolute",
        zIndex: 999,
    }
});

export default function ContainedBackdrop({ children, open }: React.PropsWithChildren<{ open: boolean }>) {
    const classes = useStyles();

    return (
        <Box className={classes.parent}>
            <Backdrop className={classes.backdrop} open={open}>
                <CircularProgress color="inherit" />
            </Backdrop>
            {children}
        </Box>
    );
}