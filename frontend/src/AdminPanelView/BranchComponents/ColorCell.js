import { Container, Menu } from "@mui/material";
import { ChromePicker } from 'react-color';
import { useEffect } from "react";
import { useState } from "react";

function ColorMenu({
    isDialogOpen,
    setIsDialogOpen,
    anchor,
    backgroundColor,
    setBackgroundColor,
    id,
    api,
    field
}) {

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    return (
        <Menu
            open={isDialogOpen}
            onClose={handleClose}
            anchorEl={anchor}
        >
            <ChromePicker
                color={backgroundColor}
                disableAlpha
                onChangeComplete={(color) => {
                    setBackgroundColor(color.hex);
                    api.setEditCellValue({ id, field, value: color.hex })
                }}
            />
        </Menu>
    );
}

export default function ColorCell({
    readonly,
    color,
    mode,
    id,
    api,
    field
}) {
    const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
    const [branchColor, setBranchColor] = useState('#fff');
    const [menuAnchor, setMenuAnchor] = useState(null);

    useEffect(() => setBranchColor(color), [color]);
    useEffect(() => {
        if (mode === 'view') {
            setBranchColor(color);
        }
    }, [mode]);

    return (
        <>
            <Container
                onClick={(e) => {
                    if (!readonly) {
                        setIsColorDialogOpen(true);
                        setMenuAnchor(e.currentTarget);
                    }
                }}
                sx={{
                    backgroundColor: branchColor,
                    cursor: readonly ? "" : "pointer",
                    height: '100%'
                }}
            />
            <ColorMenu
                isDialogOpen={isColorDialogOpen}
                setIsDialogOpen={setIsColorDialogOpen}
                anchor={menuAnchor}
                backgroundColor={branchColor}
                setBackgroundColor={setBranchColor}
                id={id}
                api={api}
                field={field}
            />
        </>
    );
}
