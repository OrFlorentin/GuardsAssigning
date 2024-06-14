import { Button } from "@mui/material";
import { GridAddIcon, GridToolbarContainer } from "@mui/x-data-grid";

function randomId() {
    const characters = '0123456789abcdef';
    const idLen = 20;
    let resultId = [];
    for (let i = 0; i < idLen; i++) {
        const index = Math.floor(characters.length * Math.random());
        resultId.push(characters[index]);
    }
    return resultId.join('');
}

export default function ManageBranchesToolBar({apiRef}) {

    const handleClick = () => {
        const id = randomId();
        apiRef.current.updateRows([{ id, isNew: true }]);
        apiRef.current.setRowMode(id, 'edit');
        // Wait for the grid to render with the new row
        setTimeout(() => {
            apiRef.current.scrollToIndexes({
                rowIndex: apiRef.current.getRowsCount() - 1,
            });

            apiRef.current.setCellFocus(id, 'name');
        });
    };

    return (
        <GridToolbarContainer>
            <Button color="primary" startIcon={<GridAddIcon sx={{pl: 1}}/>} onClick={handleClick}>
                הוסף קבוצה
            </Button>
        </GridToolbarContainer>
    );
}

