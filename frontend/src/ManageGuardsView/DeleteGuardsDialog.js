import { Dialog, DialogContent, DialogTitle, DialogActions, Button } from '@mui/material';
import styled from 'styled-components';
import { BoldText } from '../Shared/Containers';
import CloseButton from '../Shared/CloseButton';
import { deleteGuard } from '../Shared/Calls';
import { useAppContext } from '../Shared/AppContext';
import { useCustomSnackbar } from '../Shared/SnackbarUtils';

const getGuardsCountString = (count) => (count === 1 ? 'משתמש' : `${count} משתמשים`);

const getGuardsToDeleteString = (guardsToDelete) => {
    if (guardsToDelete?.length === 1) {
        return (
            <span>
                המשתמש <BoldText>{guardsToDelete[0]?.name}</BoldText>?
            </span>
        );
    }

    return (
        <span>
            המשתמשים:
            <ul>
                {guardsToDelete.map((guard, index) => (
                    <li key={index}>
                        <BoldText>{guard.name}</BoldText>
                    </li>
                ))}
            </ul>
        </span>
    );
};

export default function DeleteGuardsDialog({
    isDialogOpen,
    setIsDialogOpen,
    guardsToDelete,
    resetSelectedRows,
}) {
    const { setGuards } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar } = useCustomSnackbar();

    const dialogTitle = `מחיקת ${getGuardsCountString(guardsToDelete.length)}`;

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    const deleteGuardById = (guardId) => {
        deleteGuard(guardId).then(() => {
            setGuards((prevGuards) => {
                const newGuards = [...prevGuards];
                const index = newGuards.findIndex((guard) => guard._id === guardId);

                if (index >= 0) {
                    newGuards.splice(index, 1);
                }

                return newGuards;
            });

            resetSelectedRows();

            showSuccessSnackbar('delete-guard-success', `${dialogTitle} הצליחה`)
        })
        .catch(() => {
            showErrorSnackbar('delete-guard-failed', `${dialogTitle} נכשלה`)
        });
    };

    return (
        <Dialog open={isDialogOpen} onClose={handleClose} maxWidth="sm" dir="rtl" fullWidth>
            <DialogTitle>
                {dialogTitle}
                <CloseButton onClick={handleClose} />
            </DialogTitle>

            <DialogContent>
                האם אתה בטוח שברצונך למחוק את {getGuardsToDeleteString(guardsToDelete)}
            </DialogContent>

            <DialogActions>
                <ActionButton variant="outlined" onClick={handleClose}>
                    ביטול
                </ActionButton>
                <ActionButton
                    variant="outlined"
                    color="error"
                    onClick={() => {
                        guardsToDelete.forEach((guard) => deleteGuardById(guard._id));

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
