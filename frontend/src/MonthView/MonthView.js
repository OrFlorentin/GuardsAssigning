import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { Fab } from '@mui/material';
import Box from '@mui/material/Box';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import CalendarHeader from '../Calendar/CalendarHeader';
import DayNames, { DAYS } from '../Calendar/DayNames';
import { useAppContext } from '../Shared/AppContext';
import { fetchAndUpdateGuards } from '../Shared/Calls';
import { CenterContainer, ResponsiveContainer, RowContainerCentered } from '../Shared/Containers';
import BranchSelect from '../Shared/Select/BranchSelect';
import PopulationTypeSelect from '../Shared/Select/PopulationTypeSelect';
import ShiftTypeSelect from '../Shared/Select/ShiftTypeSelect';
import ShiftDialog from '../Shared/ShiftDialog';
import { getShiftsForDate, getShiftType, isBranchManager, isMobile } from '../Shared/Utils';
import AutoAssignDialog from './AutoAssignDialog';
import DayTile from './DayTile';

const MONTH_DAYS_RANGE = Array.from(Array(42).keys());

export default function MonthView() {
    const { guards, setGuards, shifts, filteredBranch, filteredShiftType, filteredPopulationType, shiftTypes, currentUser } = useAppContext();

    const [isAutoAssignDialogOpen, setIsAutoAssignDialogOpen] = useState(false);
    const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
    const [monthYear, setMonth] = useState(moment().format('MMM YYYY'));
    const [activeShift, setActiveShift] = useState({});

    const isEditMode = isBranchManager(currentUser);

    const startDayOfMonthName = useMemo(
        () => moment(monthYear, 'MMM YYYY').startOf('month').format('dddd'),
        [monthYear]
    );

    const datesRange = useMemo(() => {
        const firstDateInRange = moment(monthYear, 'MMM YYYY').subtract(
            DAYS.indexOf(startDayOfMonthName),
            'day'
        );
        return MONTH_DAYS_RANGE.map((i) =>
            firstDateInRange.clone().add(i, 'day').format('YYYY-MM-DD')
        );
    }, [monthYear, startDayOfMonthName]);

    const handleBackMonth = () => {
        setMonth((prevMonth) => moment(prevMonth, 'MMM YYYY').subtract(1, 'month').format('MMM YYYY'));
    };

    const handleNextMonth = () => {
        setMonth((prevMonth) => moment(prevMonth, 'MMM YYYY').add(1, 'month').format('MMM YYYY'));
    };

    const filteredShifts = useMemo(() => {
        let filteredShifts = shifts;

        if (filteredBranch) {
            filteredShifts = filteredShifts.filter((shift) => shift.branch === filteredBranch);
        }

        if (filteredPopulationType) {
            filteredShifts = filteredShifts.filter((shift) => shift.population_type === filteredPopulationType);
        }

        if (filteredShiftType) {
            filteredShifts = filteredShifts.filter(
                (shift) => getShiftType(shift, shiftTypes)?._id === filteredShiftType
            );
        }

        return filteredShifts;
    }, [shifts, filteredBranch, filteredShiftType, filteredPopulationType]);

    useEffect(() => {
        fetchAndUpdateGuards(setGuards);
    }, [shifts])
    
    return (
        <>
            <Box>
                <CenterContainer>
                    <ResponsiveContainer marginTop={'5em'} width={'70%'} maxWidth={600}>
                        <CalendarHeader
                            handleBack={handleBackMonth}
                            handleNext={handleNextMonth}
                            title={monthYear}
                        />
                        <RowContainerCentered>
                            <BranchSelect />
                            <PopulationTypeSelect />
                            <ShiftTypeSelect />
                        </RowContainerCentered>
                    </ResponsiveContainer>
                    <Grid>
                        <DayNames />

                        {MONTH_DAYS_RANGE.map((i) => (
                            <DayTile
                                key={i}
                                date={datesRange[i]}
                                monthYear={monthYear}
                                dailyShifts={getShiftsForDate(filteredShifts, datesRange[i])}
                                isEditMode={isEditMode}
                                setIsDialogOpen={setIsShiftDialogOpen}
                                setActiveShift={setActiveShift}
                            />
                        ))}
                    </Grid>
                </CenterContainer>
            </Box>

            {isEditMode && (
                <>
                    <ShiftDialog
                        isDialogOpen={isShiftDialogOpen}
                        setIsDialogOpen={setIsShiftDialogOpen}
                        activeShift={activeShift}
                    />

                    <AutoAssignDialog
                        isDialogOpen={isAutoAssignDialogOpen}
                        setIsDialogOpen={setIsAutoAssignDialogOpen}
                        guards={guards}
                        shifts={shifts}
                    />

                    <Fab
                        variant="extended"
                        size="medium"
                        color="secondary"
                        style={{
                            position: 'fixed',
                            bottom: '16px',
                            right: '16px',
                        }}
                        onClick={() => {
                            setIsAutoAssignDialogOpen(true);
                        }}
                    >
                        <AutoFixHighIcon sx={{ mr: 1 }} />
                        Auto Assign
                    </Fab>
                </>
            )}
        </>
    );
}


const Grid = styled.div`
    display: grid;
    grid-template-rows: 50px;
    grid-auto-rows: minmax(150px, 1fr);
    grid-template-columns: repeat(7, ${isMobile() ? '30' : '10'}vw);
    grid-row-gap: 2px;
    grid-column-gap: 2px;
    margin-top: 2em;
    ${isMobile() ? `
    overflow-x: auto;
    width: 90%;` : ''}
`;
