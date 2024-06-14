import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, InputLabel, MenuItem } from '@mui/material';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import { useState } from 'react';

export default function RestrictionReasonDialog({
    isDialogOpen,
    handleClose,
    sendRestrictionsWithNewReason,
}) {
    const REASONS_LIST = ['רפואית', 'לימודים', 'אירוע משפחתי', 'אחר'];
    const [reason, setReason] = useState('');
    const handleReasonChange = (e) => setReason(e.target.value);
    const resetReason = () => setReason('');

    const onSend = () => {
        if (!reason) return;
        sendRestrictionsWithNewReason(reason);

        resetReason();
        handleClose();
    };

    return (
        <Dialog open={isDialogOpen} onClose={handleClose}>
            <DialogTitle>סיבה להסתייגות</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    הוסיפו את הסיבה להסתייגות. הסיבה תישלח עבור ימי ההסתייגויות החדשים שבחרתם
                </DialogContentText>

                <FormControl
                    margin="dense"
                    fullWidth
                >
                    <InputLabel id="reason-select-label">סיבה</InputLabel>

                    <Select
                        labelId="demo-simple-select-label"
                        id="reason-select"
                        label="סיבה"
                        onChange={handleReasonChange}
                        value={reason}
                        fullWidth

                    >
                        {
                            REASONS_LIST.map((option) =>
                                <MenuItem
                                    key={option}
                                    value={option}>
                                    {option}
                                </MenuItem>
                            )
                        }
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>ביטול</Button>
                <Button onClick={onSend}>הוסף הסתייגות</Button>
            </DialogActions>
        </Dialog>
    );
}
