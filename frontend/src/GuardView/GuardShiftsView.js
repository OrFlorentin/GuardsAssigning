import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../Shared/AppContext';
import { getGuardShifts } from '../Shared/Utils';
import DailyGuardsDialog from './ShiftComponents/DailyGuardsDialog';
import ShiftCardsGrid from './ShiftComponents/ShiftCardsGrid';
import ShiftDetailsDialog from './ShiftComponents/ShiftDetailsDialog';
import ExportCalendarButton from './ShiftComponents/ExportCalendarButton';
import { ViewContainer } from '../Shared/Containers';

export default function GuardView() {
    const { shifts, currentUser } = useAppContext();

    const [isShiftDetailsDialogOpen, setIsShiftDetailsDialogOpen] = useState(false);
    const [isDailyGuardsDialogOpen, setIsDailyGuardsDialogOpen] = useState(false);
    const [activeShift, setActiveShift] = useState({});

    const getShifts = () => {
        const guardShifts = getGuardShifts(currentUser, shifts);

        if (guardShifts.length === 0) {
            return (
                <ViewContainer>
                    <SmallHeader>לא מופיעים משחקים במערכת</SmallHeader>
                </ViewContainer>
            );
        }

        return (
            <ViewContainer>
                <h1>המשחקים שלי</h1>

                <ShiftCardsGrid
                    shifts={getGuardShifts(currentUser, shifts)}
                    setActiveShift={setActiveShift}
                    setIsShiftDetailsDialogOpen={setIsShiftDetailsDialogOpen}
                    guard={currentUser}
                />

                <ExportCalendarButton guard={currentUser} />
            </ViewContainer>
        );
    }

    return (
        <>
            {getShifts()}

            <ShiftDetailsDialog
                activeShift={activeShift}
                isShiftDetailsDialogOpen={isShiftDetailsDialogOpen}
                setShiftDetailsIsDialogOpen={setIsShiftDetailsDialogOpen}
                setDailyGuardsIsDialogOpen={setIsDailyGuardsDialogOpen}
            />

            <DailyGuardsDialog
                activeShift={activeShift}
                isDialogOpen={isDailyGuardsDialogOpen}
                setIsDialogOpen={setIsDailyGuardsDialogOpen}
            />
        </>
    );
}

const SmallHeader = styled.h3`
    text-align: center;
`;
