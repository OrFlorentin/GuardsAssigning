import Grid from '@mui/material/Grid';
import ShiftCard from './ShiftCard';

export default function ShiftCardsGrid({
    shifts,
    setActiveShift,
    setIsShiftDetailsDialogOpen,
}) {
    return (
        <Grid container spacing={2}>
            {shifts.map((shift, index) => (
                <Grid item key={index} xs={12} sm={6} md={4}>
                    <ShiftCard
                        shift={shift}
                        setActiveShift={setActiveShift}
                        setIsShiftDetailsDialogOpen={setIsShiftDetailsDialogOpen}
                    />
                </Grid>
            ))}
        </Grid>
    );
}
