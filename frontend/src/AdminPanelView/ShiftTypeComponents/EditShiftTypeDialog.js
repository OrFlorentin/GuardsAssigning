import BaseShiftTypeDialog from "./BaseShiftTypeDialog";

export default function EditShiftTypeDialog({
    isDialogOpen,
    setIsDialogOpen,
    activeShiftType
}) {
    return (
        <BaseShiftTypeDialog 
            isEdit
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            activeShiftType={activeShiftType}
        />
    );
}
