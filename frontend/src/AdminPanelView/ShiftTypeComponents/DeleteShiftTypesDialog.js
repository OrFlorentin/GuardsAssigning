import { Dialog, DialogContent, DialogTitle, DialogActions, Button } from '@mui/material';
import styled from 'styled-components';
import { BoldText } from '../../Shared/Containers';
import CloseButton from '../../Shared/CloseButton';
import { useCustomSnackbar } from '../../Shared/SnackbarUtils';
import { deleteShiftType, fetchAndUpdateShiftTypes } from '../../Shared/Calls';
import { useAppContext } from '../../Shared/AppContext';

const getShiftTypesCountString = (count) => (count === 1 ? 'סוג המשחק' : `${count} סוגי המשחקים`);

const getShiftTypesToDeleteString = (shiftTypesToDelete) => {
    if (shiftTypesToDelete?.length === 1) {
        return (
            <span>
                סוג המשחק <BoldText>{shiftTypesToDelete[0]?.name}</BoldText>?
            </span>
        );
    }

    return (
        <span>
            סוגי המשחקים:
            <ul>
                {shiftTypesToDelete.map((shiftType, index) => (
                    <li key={index}>
                        <BoldText>{shiftType.name}</BoldText>
                    </li>
                ))}
            </ul>
        </span>
    );
};

export default function DeleteShiftTypesDialog({
    isDialogOpen,
    setIsDialogOpen,
    shiftTypesToDelete
}) {
    const { setShiftTypes } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar } = useCustomSnackbar();

    const dialogTitle = `מחיקת ${getShiftTypesCountString(shiftTypesToDelete.length)}`;

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    const deleteShiftTypeById = (shiftTypeId) => {
        deleteShiftType(shiftTypeId).then(() => {
            fetchAndUpdateShiftTypes(setShiftTypes).then(() => {
                showSuccessSnackbar('delete-shift-type-success', 'מחיקת סוג משחק הושלמה');
            });
        }).catch(() => {
            showErrorSnackbar('delete-shift-type-failed', 'מחיקת סוג משחק נכשלה');
        });
    };

    return (
        <Dialog open={isDialogOpen} onClose={handleClose} maxWidth="sm" dir="rtl" fullWidth>
            <DialogTitle>
                {dialogTitle}
                <CloseButton onClick={handleClose} />
            </DialogTitle>

            <DialogContent>
                האם אתה בטוח שברצונך למחוק את {getShiftTypesToDeleteString(shiftTypesToDelete)}
            </DialogContent>

            <DialogActions>
                <ActionButton variant="outlined" onClick={handleClose}>
                    ביטול
                </ActionButton>
                <ActionButton
                    variant="outlined"
                    color="error"
                    onClick={() => {
                        shiftTypesToDelete.forEach((shiftType) => deleteShiftTypeById(shiftType._id));

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
