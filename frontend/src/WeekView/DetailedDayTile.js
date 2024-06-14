import AddIcon from '@mui/icons-material/Add';
import { Card, List } from '@mui/material';
import moment from 'moment';
import React from 'react';
import styled from 'styled-components';
import { useAppContext } from '../Shared/AppContext';
import { getBranchName, getShiftTitle, getShiftType, isAdmin, isBranchManager } from '../Shared/Utils';
import { darkenColor } from '../Shared/ColorDarkenLighen';
import { useMemo } from 'react';

export default function DetailedDayTile({
    date,
    onClick,
    dailyShifts,
    setIsDialogOpen,
    setActiveShift,
}) {
    const { guards, branches, branchColors, shiftTypes, currentUser } = useAppContext();
    const isToday = useMemo(
        () => moment(date).isSame(moment(), 'day'),
        [date]
    );

    return (
        <DayCard
            sx={{ boxShadow: 2 }}
            style={{
                color: isToday ? "red" : undefined,
                backgroundColor: isToday ? "#ffeded" : undefined,
            }}>
            <DayHeader>{moment(date).format('D')}</DayHeader>

            <ShiftTypeContainer variant={'outlined'} onClick={onClick}>
                <List component="nav" aria-label="contacts" style={{ width: '100%' }}>
                    {dailyShifts &&
                        dailyShifts.map((shift) => (
                            <>
                                <ShiftCard
                                    sx={{ boxShadow: 2 }}
                                    backgroundColor={
                                        shift.assigned_user_id
                                            ? branchColors[shift.branch] || 'gray'
                                            : '#ffffff'
                                    }
                                    style={{
                                        borderRadius: '26px',
                                        borderStyle: shift.branch ? 'solid' : 'dashed',
                                        borderColor: shift.branch
                                            ? branchColors[shift.branch] || 'gray'
                                            : 'black',
                                        borderWidth: shift.assigned_user_id ? 0 : '2px',
                                        fontWeight: shift.assigned_user_id ? 400 : 500,
                                        color: shift.assigned_user_id ? 'white' : 'black',
                                    }}
                                    variant={shift.assigned_user_id ? 'unset' : 'outlined'}
                                    onClick={() => {
                                        if (isAdmin(currentUser) || (shift.branch && isBranchManager(currentUser))) {
                                            setIsDialogOpen(true);
                                            setActiveShift(shift);
                                        }
                                    }}
                                >
                                    <ShiftContent>
                                        <ShiftTitle>{getShiftTitle(shift, guards, branches)}</ShiftTitle>
                                        {shift.assigned_user_id && (
                                            <ShiftContentLabel>{getBranchName(shift.branch, branches)}</ShiftContentLabel>
                                        )}
                                        {!shift.branch && isAdmin(currentUser) && (
                                            <AddIcon style={{ alignSelf: 'center' }} />
                                        )}
                                        <ShiftContentLabel>
                                            {getShiftType(shift, shiftTypes)?.name}
                                        </ShiftContentLabel>
                                        <ShiftContentLabel>סבב {shift.order + 1}</ShiftContentLabel>
                                    </ShiftContent>
                                </ShiftCard>
                            </>
                        ))}
                </List>
            </ShiftTypeContainer>
        </DayCard>
    );
}

const DayCard = styled(Card)`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

const ShiftTypeContainer = styled.div`
    width: 90%;
    align-self: center;
`;

const ShiftCard = styled(Card)`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1em;
    cursor: pointer;
    height: 6em;
    box-sizing: border-box;

    background-color: ${({ backgroundColor }) => backgroundColor};

    &:hover {
        background-color: ${({ backgroundColor }) =>
        backgroundColor && darkenColor(backgroundColor, 20)};
    }
`;

const ShiftTitle = styled.div`
    font-weight: 500;
`;

const ShiftContent = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
    padding: 0.5em 1em;
`;

const ShiftContentLabel = styled.div`
    font-size: 0.8em;
`;

const DayHeader = styled.div`
    margin: 5px 0 0 5px;
    font-weight: 500;
`;
