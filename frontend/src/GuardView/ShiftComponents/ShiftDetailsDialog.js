import ShiftDetails from './ShiftDetails';
import CloseButton from '../../Shared/CloseButton';
import { useAppContext } from '../../Shared/AppContext';
import { getShiftType } from '../../Shared/Utils';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
} from '@mui/material';

export default function ShiftDetailsDialog({
    activeShift,
    isShiftDetailsDialogOpen,
    setShiftDetailsIsDialogOpen,
    setDailyGuardsIsDialogOpen,
}) {
    const { shiftTypes } = useAppContext();

    const handleClose = () => {
        setShiftDetailsIsDialogOpen(false);
    };

    const handleButtonClick = () => {
        setShiftDetailsIsDialogOpen(false);
        setDailyGuardsIsDialogOpen(true);
    };

    return (
        <Dialog
            open={isShiftDetailsDialogOpen}
            onClose={handleClose}
            maxWidth="sm"
            dir="rtl"
            fullWidth
        >
            <DialogTitle>
                <ShiftDetails shift={activeShift} />
                <CloseButton onClick={handleClose} />
            </DialogTitle>

            <DialogContent>
                <Typography gutterBottom>
                    {getShiftType(activeShift, shiftTypes)?.description}
                </Typography>
            </DialogContent>

            <DialogActions>
                <Button variant="outlined" onClick={handleButtonClick}>
                    שחקנים באותו היום
                </Button>
            </DialogActions>
        </Dialog>
    );
}
