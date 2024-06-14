import { LinearProgress } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function LoadingDialog({ isLoading, title, children }) {

    return (
        <Dialog
            dir="rtl"
            open={isLoading}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {children}
                </DialogContentText>
                <LinearProgress sx={{ mt: 5 }} />
            </DialogContent>
        </Dialog>
    );
}
