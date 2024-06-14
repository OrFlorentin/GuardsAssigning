import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ListAltIcon from '@mui/icons-material/ListAlt';
import GroupsIcon from "@mui/icons-material/Groups";

export function getManageGuardsActions(
    filteredGuards,
    setActiveGuard,
    setGuardsToDelete,
    setIsEditDialogOpen,
    setIsScoreDialogOpen,
    setIsDeleteDialogOpen,
    setIsRolesDialogOpen
) {
    return (params) => [
        <GridActionsCellItem
            icon={<EditIcon />}
            onClick={() => {
                setActiveGuard(filteredGuards.find((guard) => guard._id === params.row._id));
                setIsEditDialogOpen(true);
            }}
        />,
        <GridActionsCellItem
            icon={<ListAltIcon />}
            onClick={() => {
                setActiveGuard(filteredGuards.find((guard) => guard._id === params.row._id));
                setIsScoreDialogOpen(true);
            }}
        />,
        <GridActionsCellItem
            label="Delete User"
            icon={<DeleteIcon />}
            onClick={() => {
                setGuardsToDelete([params.row]);
                setIsDeleteDialogOpen(true);
            }}
            showInMenu
        />,
        <GridActionsCellItem
            label="Roles"
            icon={<GroupsIcon/>}
            onClick={() => {
                setActiveGuard(filteredGuards.find((guard) => guard._id === params.row._id));
                setIsRolesDialogOpen(true);
            }}
            showInMenu
        />,
    ];
}
