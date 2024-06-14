import { GridActionsCellItem } from "@mui/x-data-grid";
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from "@mui/icons-material/Delete";
import { deleteBranch, editBranch, fetchAndUpdateBranches, putBranch } from "../../Shared/Calls";

// Most of this code was copied and slightly modified from here:
// https://mui.com/components/data-grid/editing/#FullFeaturedCrudGrid.js

export function getManageBranchesActions(apiRef, setBranches, snackbars) {
    const { showSuccessSnackbar, showErrorSnackbar } = snackbars;

    const handleError = (key) => (e) => {
        let msg;
        try {
            msg = `${e.response.data.detail[0].loc.join('.')} - ${e.response.data.detail[0].msg}`;
        }
        catch {
            msg = e.message;
        }
        finally {
            showErrorSnackbar(key, msg);
        }
    };
    
    async function sendPutBranch(row) {
        const params = {
            name: row.name,
            color: row.color
        };
        let result = false;
        await putBranch(params).then(() => {
            showSuccessSnackbar('put-branch-success', 'יצירת קבוצה הושלמה');
            result = true;
        }).catch(handleError('put-branch-failed'));
        return result;
    }
    
    async function sendEditBranch(row) {
        const params = {
            name: row.name,
            color: row.color  
        };
        let result = false;
        await editBranch(row.id, params).then(() => {
            showSuccessSnackbar('edit-branch-success', 'עריכת קבוצה הושלמה');
            result = true;
        }).catch(handleError('edit-branch-failed'));
        return result;
    }
    
    async function sendDeleteBranch(id) {
        let result = false;
        await deleteBranch(id).then(() => {
            showSuccessSnackbar('delete-branch-success', 'מחיקת קבוצה הושלמה');
            result = true;
        }).catch((e) => {
            if (Math.floor(e.response.status / 100) === 4) {
                showErrorSnackbar('delete-branched-failed', e.response.data.detail);
            } else {
                showErrorSnackbar('delete-branched-failed', 'מחיקת קבוצה נכשלה');
            }
        });
        return result;
    }

    const handleEditClick = (id) => (event) => {
        event.stopPropagation();
        apiRef.current.setRowMode(id, 'edit');
    };

    const handleSaveClick = (id) => async (event) => {
        // When the save button is clicked, try to edit/create a branch on the server
        // and commit the edited row in the grid.
        // If failed, revert back to the old row.
        event.stopPropagation();

        // Row is in edit mode, so calling getRow() will return the initial values.
        const oldRow = apiRef.current.getRow(id);

        // Commiting changes validates the fields and changes the row back to view mode.
        if (await apiRef.current.commitRowChange(id))
        {
            const row = apiRef.current.getRow(id);
            let isValid = false;

            // `isNew` indicates if the row is being edited or if it was just created.
            if (oldRow.isNew) {
                isValid = await sendPutBranch(row);
            } else {
                isValid = await sendEditBranch(row);
            }

            if (isValid) {
                fetchAndUpdateBranches(setBranches);
                apiRef.current.setRowMode(id, 'view');
                apiRef.current.updateRows([{ ...row, isNew: false }]);
            } else {
                apiRef.current.updateRows([{ ...oldRow, isNew: oldRow.isNew }]);
            }
        } else {
            apiRef.current.updateRows([{ ...oldRow, isNew: oldRow.isNew }]);
        }
    };

    const handleDeleteClick = (id) => async (event) => {
        event.stopPropagation();
        const isValid = await sendDeleteBranch(id);
        if (isValid) {
            fetchAndUpdateBranches(setBranches);
            apiRef.current.updateRows([{ id, _action: 'delete' }]);
        }
    };

    const handleCancelClick = (id) => (event) => {
        event.stopPropagation();
        apiRef.current.setRowMode(id, 'view');

        const row = apiRef.current.getRow(id);
        if (row.isNew) {
            apiRef.current.updateRows([{ id, _action: 'delete' }]);
        }
    };

    return ({ id }) => {
        const isInEditMode = apiRef.current.getRowMode(id) === 'edit';

        if (isInEditMode) {
            return [
                <GridActionsCellItem
                    icon={<SaveIcon />}
                    label="Save"
                    onClick={handleSaveClick(id)}
                    color="primary"
                />,
                <GridActionsCellItem
                    icon={<CancelIcon />}
                    onClick={handleCancelClick(id)}
                />
            ];
        }

        return [
            <GridActionsCellItem
                icon={<EditIcon />}
                onClick={handleEditClick(id)}
            />,
            <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Delete"
                onClick={handleDeleteClick(id)}
            />
        ];
    };
}

