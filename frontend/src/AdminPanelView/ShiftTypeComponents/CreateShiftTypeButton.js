import { Fab } from "@mui/material";
import { GridAddIcon } from "@mui/x-data-grid";


export default function CreateShiftTypeButton({
    setIsCreateDialogOpen
}) {
    const addFabStyle = {
        position: 'fixed',
        bottom: 30,
        right: 38,
    };

    return (
        <Fab 
            sx={addFabStyle} 
            color="primary" 
            aria-label="add"
            onClick={() => {setIsCreateDialogOpen(true)}}
        >
            <GridAddIcon />
        </Fab>
    );
}
