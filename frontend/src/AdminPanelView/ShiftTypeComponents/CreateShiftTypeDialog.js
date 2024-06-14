import BaseShiftTypeDialog from "./BaseShiftTypeDialog";

export default function CreateShiftTypeDialog({
    isDialogOpen,
    setIsDialogOpen
}) {
    return (
        <BaseShiftTypeDialog 
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
        />
    );
}
