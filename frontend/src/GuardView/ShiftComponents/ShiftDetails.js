import React from 'react';
import { Typography } from '@mui/material';
import { useAppContext } from '../../Shared/AppContext';
import { getShiftType, getHebrewDateText } from '../../Shared/Utils';

export default function ShiftDetails({ shift }) {
    const { shiftTypes } = useAppContext();

    return (
        <>
            <Typography color="textSecondary" gutterBottom>
                {getHebrewDateText(shift.date)}
            </Typography>
            <Typography variant="h5" component="h2">
                {getShiftType(shift, shiftTypes)?.name}
            </Typography>
            <Typography color="textSecondary">סבב {shift.order + 1}</Typography>
        </>
    );
}
