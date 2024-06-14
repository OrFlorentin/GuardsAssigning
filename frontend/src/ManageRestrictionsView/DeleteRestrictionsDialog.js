import { Dialog, DialogContent, DialogTitle, DialogActions, Button } from '@mui/material';
import styled from 'styled-components';
import CloseButton from '../Shared/CloseButton';
import { fetchAndUpdateGuards, putGuard } from '../Shared/Calls';
import { useAppContext } from '../Shared/AppContext';
import { deleteObjectFromList, getOnlyPopulationSettingsAndAlert, isSameDate } from '../Shared/Utils';
import { useCustomSnackbar } from '../Shared/SnackbarUtils';

const getCountString = (count) => (count === 1 ? 'הסתייגות' : `${count} הסתייגויות`);

export default function DeleteRestrictionsDialog({
    isDialogOpen,
    setIsDialogOpen,
    objectsToDelete,
    resetSelectedRows,
}) {
    const { guards, setGuards } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar, showWarningSnackbar } = useCustomSnackbar();

    const dialogTitle = `מחיקת ${getCountString(objectsToDelete.length)}`;

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    const deleteRestriction = (selectedRestriction) => {
        const guard = guards.find((guard) => guard._id === selectedRestriction?.guardId);
        if (!guard) return;

        const guardPopulationSettings = getOnlyPopulationSettingsAndAlert(guard, showWarningSnackbar);

        deleteObjectFromList(guardPopulationSettings?.restrictions, (restriction) => {
            const is_date = isSameDate(restriction.date, selectedRestriction?.date);

            return is_date && restriction.reason === selectedRestriction?.reason;
        })

        putGuard(guard).then(() => {
            fetchAndUpdateGuards(setGuards);
            resetSelectedRows();

            showSuccessSnackbar('delete-restriction-success', `${dialogTitle} הצליחה`);
        })
        .catch(() => {
            showErrorSnackbar('delete-restriction-failed', `${dialogTitle} נכשלה`);
        });
    }

    return (
        <Dialog open={isDialogOpen} onClose={handleClose} maxWidth="sm" dir="rtl" fullWidth>
            <DialogTitle>
                {dialogTitle}
                <CloseButton onClick={handleClose} />
            </DialogTitle>

            <DialogContent>
                האם אתה בטוח שברצונך למחוק {getCountString(objectsToDelete.length)}?
            </DialogContent>

            <DialogActions>
                <ActionButton variant="outlined" onClick={handleClose}>
                    ביטול
                </ActionButton>
                <ActionButton
                    variant="outlined"
                    color="error"
                    onClick={() => {
                        objectsToDelete.forEach((restriction) => deleteRestriction(restriction));

                        setIsDialogOpen(false);
                    }}
                >
                    מחק
                </ActionButton>
            </DialogActions>
        </Dialog>
    );
}

const ActionButton = styled(Button)`
    margin: 4px;
`;
