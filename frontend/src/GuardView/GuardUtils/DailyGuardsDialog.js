import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useAppContext } from '../../Shared/AppContext';
import DailyGuardsTable from './DailyGuardsTable';
import CloseButton from '../../Shared/CloseButton';
import {
    getHebrewDateText,
    getShiftType,
    getShiftsForDate,
    filterShiftsByLocation,
    filterShiftsByShiftType,
} from '../../Shared/Utils';

function getShiftsForDailyGuardsTable(selectedShift, shifts, shiftTypes) {
    if (!selectedShift) {
        return;
    }

    const allDailyShifts = getShiftsForDate(shifts, selectedShift.date);
    const selectedShiftType = getShiftType(selectedShift, shiftTypes);

    if (selectedShiftType?.location) {
        return filterShiftsByLocation(allDailyShifts, selectedShiftType.location, shiftTypes);
    }

    return filterShiftsByShiftType(allDailyShifts, selectedShiftType);
}

export default function DailyGuardsDialog({ activeShift, isDialogOpen, setIsDialogOpen }) {
    const { shifts, shiftTypes } = useAppContext();

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    const getDailyShifts = () => {
        return getShiftsForDailyGuardsTable(activeShift, shifts, shiftTypes);
    };

    const getDialogTitle = () => {
        const shiftType = getShiftType(activeShift, shiftTypes);

        const shiftTypeText = shiftType?.location ? shiftType.location : shiftType?.name;
        const dateText = getHebrewDateText(activeShift.date);

        return `משתמשי "${shiftTypeText}" ב${dateText}`;
    };

    return (
        <Dialog open={isDialogOpen} onClose={handleClose} fullWidth={true} maxWidth="sm" dir="rtl">
            <DialogTitle>
                {getDialogTitle()}
                <CloseButton onClick={handleClose} />
            </DialogTitle>
            <DialogContent>
                <DailyGuardsTable dailyShifts={getDailyShifts()} />
            </DialogContent>
        </Dialog>
    );
}
