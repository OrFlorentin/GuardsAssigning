import { Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const getGuardsCountString = (count) => (count === 1 ? 'Guard' : `${count} Guards`);

export default function DeleteGuardsButton({
    variant,
    style,
    selectedGuardRows,
    setGuardsToDelete,
    setIsDeleteDialogOpen,
    sx
}) {
    if (selectedGuardRows.length === 0) {
        return null;
    }

    return (
        <Button
            sx={sx}
            color="error"
            style={style}
            variant={variant}
            onClick={() => {
                setGuardsToDelete(selectedGuardRows);
                setIsDeleteDialogOpen(true);
            }}
        >
            <DeleteIcon style={{ paddingRight: 5 }} />
            Delete {getGuardsCountString(selectedGuardRows.length)}
        </Button>
    );
}
