import { GridActionsCellItem } from "@mui/x-data-grid";
import DeleteIcon from '@mui/icons-material/Delete';
import { isAdmin } from "../Shared/Utils";


export function getUserRolesActions(deleteRole, currentUser) {
    return (params) => [
        <GridActionsCellItem
            label="Delete Role"
            icon={<DeleteIcon/>}
            onClick={() => {
                deleteRole(params.row.id);
            }}
            disabled={!isAdmin(currentUser)}
        />,
    ];
}
