import { GridActionsCellItem } from "@mui/x-data-grid";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export function getManageShiftTypesActions (
    shiftTypes, 
    setActiveShiftType, 
    setIsEditDialogOpen,
    setShiftTypesToDelete,
    setIsDeleteDialogOpen
) {
    return (params) => [
        <GridActionsCellItem
            icon={<EditIcon />}
            onClick={() => {
                setActiveShiftType(shiftTypes.find((shiftType) => shiftType._id === params.row.id));
                setIsEditDialogOpen(true);
            }}
        />,
        <GridActionsCellItem
            label="Delete Shift Type"
            icon={<DeleteIcon />}
            onClick={() => {
                setShiftTypesToDelete([shiftTypes.find((shiftType) => shiftType._id === params.row.id)]);
                setIsDeleteDialogOpen(true);
            }}
            showInMenu
        />
    ];
};
