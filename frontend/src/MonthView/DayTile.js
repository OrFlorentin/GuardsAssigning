import React, { useMemo } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { getShiftTitle, getShiftTypeByID, isMobile } from '../Shared/Utils';
import { useAppContext } from '../Shared/AppContext';
import { darkenColor } from '../Shared/ColorDarkenLighen';
import { BoldText } from '../Shared/Containers';
import { Tooltip } from '@mui/material';

export default function DayTile({ date, monthYear, setIsDialogOpen, setActiveShift, dailyShifts, isEditMode }) {
    const { guards, branches, branchColors, shiftTypes } = useAppContext();

    const isBlocked = useMemo(
        () => moment(date).month() !== moment(monthYear, 'MMM YYYY').month(),
        [date, monthYear]
    );

    const isToday = useMemo(
        () => moment(date).isSame(moment(), 'day'),
        [date]
    );

    const handleShiftClick = (shift) => {
        setIsDialogOpen(true);
        setActiveShift(shift);
    };

    return (
        <Tile style={{
            color: isToday ? "red" : undefined,
            borderColor: isToday ? "red" : undefined,
            backgroundColor: isToday ? "#ffeded" : undefined,
        }} isBlocked={isBlocked}>
            <Wrapper>
                <BoldText>{moment(date).format('D')}</BoldText>

                {dailyShifts &&
                    dailyShifts.map((shift, index) => (
                        <Tooltip title={shift.shift_type && getShiftTypeByID(shift.shift_type, shiftTypes)?.name} placement="left" arrow>
                            <ShiftChip
                                key={index}
                                isBlocked={isBlocked}
                                backgroundColor={
                                    (shift.assigned_user_id &&
                                        guards.find((guard) => guard._id === shift.assigned_user_id))
                                        ? branchColors[shift.branch] || 'gray'
                                        : !isBlocked && '#ffffff'
                                }
                                style={{
                                    border:
                                        (!shift.assigned_user_id ||
                                            !guards.find((guard) => guard._id === shift.assigned_user_id)) &&
                                        `2px solid ${branchColors[shift.branch] || 'gray'}`,
                                    color: (!shift.assigned_user_id ||
                                        !guards.find((guard) => guard._id === shift.assigned_user_id)) ? 'black' : 'white',
                                }}
                                //TODO: enable only for אחראי משחקים
                                onClick={() => !isBlocked && isEditMode && handleShiftClick(shift)}
                            >
                                {getShiftTitle(shift, guards, branches)}
                            </ShiftChip>
                        </Tooltip>
                    ))}
            </Wrapper>
        </Tile>
    );
}

const ShiftChip = styled.div`
    font-size: 11px;
    height: 19px;
    margin: 1px;
    width: 100%;
    align-self: center;
    border-radius: 16px;
    justify-content: center;
    align-items: center;
    display: flex;
    box-sizing: border-box;
    cursor: ${({ isBlocked }) => (isBlocked ? 'default' : 'pointer')};
    background-color: ${({ backgroundColor }) => backgroundColor};

    &:hover {
        background-color: ${({ backgroundColor, isBlocked }) =>
        backgroundColor && !isBlocked && darkenColor(backgroundColor, 20)};
    }
`;

const Tile = styled.div`
    display: flex;
    align-items: flex-start;
    color: black;
    padding: ${isMobile() ? '4px' : '8px'};
    border-radius: 4px;
    background-color: ${({ isBlocked }) => isBlocked && 'rgb(224 224 224)'};
    border: ${({ isBlocked }) => !isBlocked && '1px solid rgba(25, 118, 210, 0.5)'};
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
`;
