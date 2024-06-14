import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { useAppContext } from "../Shared/AppContext";
import { deleteUserRole, fetchAndUpdateGuards } from "../Shared/Calls";
import CloseButton from "../Shared/CloseButton";
import { useCustomSnackbar } from "../Shared/SnackbarUtils";
import AddRoleDialog from "./AddRoleDialog";
import { getUserRolesActions } from "./UserRolesActions";


export default function UserRolesDialog({
    isDialogOpen,
    setIsDialogOpen,
    activeGuard,
    setActiveGuard
}) {
    const [rows, setRows] = useState([]);
    const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
    const { guards, setGuards, currentUser } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar } = useCustomSnackbar();

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    const title = `תפקידי השומר ${activeGuard?.name}`;
    
    const deleteRole = (role_index) => {
        deleteUserRole(activeGuard._id, role_index).then(() => {
            showSuccessSnackbar('delete-role-success', 'מחיקת התפקיד הושלמה');
            fetchAndUpdateGuards(setGuards)
        }).catch((e) => {
            console.error(e);
            showErrorSnackbar('delete-role-failed', 'מחיקת התפקיד נכשלה');
        });
    };

    const columns = [
        { field: 'role', headerName: 'תפקיד', flex: 1, align: 'right' },
        { field: 'actions', type: 'actions', headerName: 'אפשרויות', minWidth: 50,
          getActions: getUserRolesActions(deleteRole, currentUser) }
    ];

    const getRoleRows = (guard) => {
        if (guard?.roles) {
            return activeGuard.roles.map((role, index) => ({'role': role, id: index}));
        }
        return [];
    };
    
    useEffect(() => setActiveGuard(guards.find((guard) => guard?._id === activeGuard?._id)), 
            [guards]);
    useEffect(() => setRows(getRoleRows(activeGuard)), [activeGuard]);

    return (
        <>
            <Dialog open={isDialogOpen} onClose={handleClose} maxWidth="md" dir="rtl" fullWidth>
                <DialogTitle>
                    {title}
                    <CloseButton onClick={handleClose} />
                </DialogTitle>

                <DialogContent>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        autoHeight
                        disableSelectionOnClick
                    />
                </DialogContent>

                <DialogActions>
                    <Button 
                        onClick={() => setIsAddRoleDialogOpen(true)}
                        variant="outlined"
                    >
                        הוסף תפקיד
                    </Button>
                </DialogActions>
            </Dialog>
            <AddRoleDialog
                isDialogOpen={isAddRoleDialogOpen}
                setIsDialogOpen={setIsAddRoleDialogOpen}
                activeGuard={activeGuard}
            />
        </>
    );
}
