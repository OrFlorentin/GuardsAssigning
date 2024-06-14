import { Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const getCountString = (count) => (count === 1 ? 'Restriction' : `${count} Restrictions`);

export default function DeleteObjectsButton({
    variant,
    style,
    rowsToDelete,
    setObjectsToDelete,
    setIsDeleteDialogOpen,
    sx
}) {
    if (rowsToDelete.length === 0) {
        return null;
    }

    return (
        <Button
            sx={sx}
            color="error"
            style={style}
            variant={variant}
            onClick={() => {
                setObjectsToDelete(rowsToDelete);
                setIsDeleteDialogOpen(true);
            }}
        >
            <DeleteIcon style={{ paddingRight: 5 }} />
            Delete {getCountString(rowsToDelete.length)}
        </Button>
    );
}
