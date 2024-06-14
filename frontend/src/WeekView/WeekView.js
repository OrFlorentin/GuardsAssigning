import AddIcon from '@mui/icons-material/Add';
import { Fab } from '@mui/material';
import { Box } from '@mui/system';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import CalendarHeader from '../Calendar/CalendarHeader';
import DayNames from '../Calendar/DayNames';
import { useAppContext } from '../Shared/AppContext';
import { fetchAndUpdateGuards } from '../Shared/Calls';
import { CenterContainer, ResponsiveContainer, RowContainerCentered } from '../Shared/Containers';
import NewSlotDialog from '../Shared/NewSlotDialog';
import PopulationTypeSelect from '../Shared/Select/PopulationTypeSelect';
import ShiftTypeSelect from '../Shared/Select/ShiftTypeSelect';
import ShiftDialog from '../Shared/ShiftDialog';
import { getShiftsForDate, getShiftType, getShiftTypeByID, isAdmin, isMobile } from '../Shared/Utils';
import DetailedDayTile from './DetailedDayTile';

const WEEK_DAYS_RANGE = Array.from(Array(7).keys());

function getWeekOfMonthString(date) {
    return date.format('MMM YYYY');
}

const getEmptyShiftSlots = (shiftsForDate, date, potentialShifts) => {
    let emptyShiftSlots = [];
    const shiftsSet = new Set(shiftsForDate.map((shift) => shift.shift_type + shift.order));

    potentialShifts.forEach((shift) => {
        if (!shiftsSet.has(shift.shift_type + shift.order)) {
            emptyShiftSlots.push({ ...shift, date, is_holiday: false, num_days: 1 });
        }
    });

    return emptyShiftSlots;
};

const getShiftsWithEmptySlots = (shifts, date, potentialShifts) => {
    const shiftsForDate = getShiftsForDate(shifts, date);
    shiftsForDate.push(...getEmptyShiftSlots(shiftsForDate, date, potentialShifts));

    shiftsForDate.sort(
        (shift1, shift2) =>
            shift1.shift_type.localeCompare(shift2.shift_type) || shift1.order - shift2.order
    );

    return shiftsForDate;
};

const getPotentialShifts = (shiftTypes, filteredShiftType, filteredPopulationType) => {
    let filteredShiftTypes = shiftTypes;

    if (filteredShiftType) {
        filteredShiftTypes = [getShiftTypeByID(filteredShiftType, shiftTypes)];
    }
    else if (filteredPopulationType) {
        filteredShiftTypes = filteredShiftTypes.filter((shiftType) => {
            return shiftType?.population_type === filteredPopulationType;
        });
    }

    return filteredShiftTypes
        .map((type) => {
            const shiftTypeOrders = Array.from(Array(type.slots_count).keys());

            return shiftTypeOrders.map((order) => ({
                shift_type: type._id,
                population_type: type.population_type,
                order: order,
            }));
        })
        .flatMap((e) => e);
};

export default function WeekView() {
    const { setGuards, shifts, shiftTypes, filteredShiftType, filteredPopulationType, currentUser } = useAppContext();

    const [firstWeekDay, setFirstWeekDay] = useState(moment().startOf('week'));
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isNewSlotDialogOpen, setIsNewSlotDialogOpen] = useState(false);
    const [activeShift, setActiveShift] = useState({});

    const potentialShifts = useMemo(
        () => getPotentialShifts(shiftTypes, filteredShiftType, filteredPopulationType),
        [shiftTypes, filteredShiftType, filteredPopulationType]
    );

    const datesRange = useMemo(() => {
        return WEEK_DAYS_RANGE.map((i) =>
            moment(firstWeekDay).clone().add(i, 'day').format('YYYY-MM-DD')
        );
    }, [firstWeekDay]);

    const handleBackWeek = () => {
        setFirstWeekDay((prevWeek) => moment(prevWeek).subtract(1, 'week'));
    };

    const handleNextWeek = () => {
        setFirstWeekDay((prevWeek) => moment(prevWeek).add(1, 'week'));
    };

    const filteredShifts = useMemo(() => {
        let filteredShifts = shifts;

        if (filteredShiftType) {
            filteredShifts = filteredShifts.filter(
                (shift) => getShiftType(shift, shiftTypes)?._id === filteredShiftType
            );
        }

        if (filteredPopulationType) {
            filteredShifts = filteredShifts.filter((shift) => shift.population_type === filteredPopulationType);
        }

        return filteredShifts;
    }, [filteredShiftType, filteredPopulationType, shifts]);

    useEffect(() => {
        fetchAndUpdateGuards(setGuards);
    }, [shifts])

    return (
        <>
            <Box>
                <CenterContainer>
                    <ResponsiveContainer marginTop={'5em'} width={'70%'} maxWidth={600}>
                        <CalendarHeader
                            handleBack={handleBackWeek}
                            handleNext={handleNextWeek}
                            title={getWeekOfMonthString(firstWeekDay)}
                        />
                        <RowContainerCentered>
                            <PopulationTypeSelect />
                            <ShiftTypeSelect />
                        </RowContainerCentered>
                    </ResponsiveContainer>
                    <Grid>
                        <DayNames />

                        {WEEK_DAYS_RANGE.map((i) => (
                            <DetailedDayTile
                                key={i}
                                date={datesRange[i]}
                                dailyShifts={getShiftsWithEmptySlots(
                                    filteredShifts,
                                    datesRange[i],
                                    potentialShifts
                                )}
                                setActiveShift={setActiveShift}
                                setIsDialogOpen={setIsDialogOpen}
                            />
                        ))}
                    </Grid>
                </CenterContainer>
            </Box>
            {isAdmin(currentUser) && <Fab
                variant="extended"
                size="medium"
                color="secondary"
                style={{
                    position: 'fixed',
                    bottom: '16px',
                    right: '16px',
                }}
                onClick={() => {
                    setIsNewSlotDialogOpen(true);
                }}
            >
                <AddIcon sx={{ mr: 1 }} />
                New Game
            </Fab>
            }

            <ShiftDialog
                isDialogOpen={isDialogOpen}
                setIsDialogOpen={setIsDialogOpen}
                activeShift={activeShift}
            />

            {isAdmin(currentUser) &&
                <NewSlotDialog
                    isDialogOpen={isNewSlotDialogOpen}
                    setIsDialogOpen={setIsNewSlotDialogOpen}
                />
            }
        </>
    );
}

const Grid = styled.div`
    display: grid;
    grid-template-rows: 50px;
    grid-auto-rows: minmax(135px, 1fr);
    grid-template-columns: repeat(7, ${isMobile() ? '30' : '10.5'}vw);
    grid-row-gap: 2px;
    grid-column-gap: 6px;
    ${isMobile() ? `
    overflow-x: auto;
    width: 90%;` : ''}
`;
