import 'react-day-picker/lib/style.css';
import React, { useEffect, useState } from 'react'
import { Button, Chip } from '@mui/material';
import { updateMyRestrictions } from '../Shared/Calls'
import { fetchAndUpdateCurrentGuard } from '../Shared/Calls';
import { getGuardDefaultPopulationSettings } from '../Shared/Utils';
import { useAppContext } from '../Shared/AppContext';
import { ViewContainer, ConstantHeader } from '../Shared/Containers'
import RestrictionReasonDialog from './RestrictionReasonDialog';
import DayPicker from './DayPicker';
import LoadingModal from './RestrictionsUtils/Components/LoadingModal'
import { useCustomSnackbar } from '../Shared/SnackbarUtils';
import moment from 'moment';

export default function GuardReservationsView() {
    const { currentUser, setCurrentUser, setGuards } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar } = useCustomSnackbar();

    const [selectedDays, setSelectedDays] = useState([]);
    const [newlySelectedDays, setNewlySelectedDays] = useState([]);
    const [hoveredDay, setHoveredDay] = useState(undefined);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const openReasonDialog = () => {
        if (newlySelectedDays.length === 0) return;

        setIsDialogOpen(true)
    };

    const closeReasonDialog = () => {
        setIsDialogOpen(false)
    };

    useEffect(() => {
        fetchAndUpdateCurrentGuard(setCurrentUser, setGuards)
            .then((currentGuard) => {
                const populationSettings = getGuardDefaultPopulationSettings(currentGuard);
                setSelectedDays(populationSettings?.restrictions);
            });
    }, [])

    const sendUpdatedRestrictions = (restrictionDays) => {
        setLoading(true)

        updateMyRestrictions(currentUser, restrictionDays)
            .then(() => {
                fetchAndUpdateCurrentGuard(setCurrentUser, setGuards).then(setLoading(false));

                showSuccessSnackbar('restrictions-update-success', 'הסתייגויות עודכנו בהצלחה');
            })
            .catch(() => {
                showErrorSnackbar('restrictions-update-failed', 'שליחת הסתייגויות נכשלה');
            });
    }

    const sendRestrictionsWithNewReason = (newReason) => {
        const newlySelectedDaysWithReason =
            newlySelectedDays.map((day) => ({ ...day, reason: newReason }));
        
        const newSelectedDays = [ ...selectedDays, ...newlySelectedDaysWithReason];
        setSelectedDays(newSelectedDays);
        setNewlySelectedDays([]);
        sendUpdatedRestrictions(newSelectedDays);
    }

    const getChipLabel = () => {
        const date = moment(hoveredDay.date).format('L');
        const reasonText = hoveredDay?.reason || 'הסתייגות שטרם נשלחה';

        return `${reasonText} (${date})`
    }

    return (
        <ViewContainer>

            <ConstantHeader>
                {hoveredDay && <Chip label={getChipLabel()} sx={{ fontSize: 16 }} />}
            </ConstantHeader>

            <DayPicker
                selectedDays={selectedDays}
                setSelectedDays={setSelectedDays}
                newlySelectedDays={newlySelectedDays}
                setNewlySelectedDays={setNewlySelectedDays}
                setHoveredDay={setHoveredDay}
            />

            <Button
                variant="outlined"
                onClick={openReasonDialog}
                disabled={loading}
                loading={loading}
            >
                שלח הסתייגויות
            </Button>

            <LoadingModal
                loading={loading}
                setLoading={setLoading}
            />

            <RestrictionReasonDialog
                isDialogOpen={isDialogOpen}
                handleClose={closeReasonDialog}
                sendRestrictionsWithNewReason={sendRestrictionsWithNewReason}
            />
        </ViewContainer>
    )
}
