import React, { useEffect, useState } from 'react'
import 'react-day-picker/lib/style.css';
import { ToggleButton } from '@mui/material';
import RestrictionReasonDialog from './RestrictionReasonDialog';
import { getRestrictions } from '../Calls'
import CustomizedDayPicker from './CustomizedDayPicker';
import CheckUncheckIcon from './CheckUncheckIcon';
import { fetchAndUpdateGuards } from '../../../Shared/Calls';
import { useAppContext } from '../../../Shared/AppContext';

export default function RestrictionsCalendar({ currentGuard }) {
    const { setGuards } = useAppContext();

    const [selectedDays, setSelectedDays] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [pressedDateCell, setPressedDateCell] = useState(undefined);
    const [multipleChoice, setmultiplechoice] = useState(false);
    const [mutipleChoiceReason, setMutipleChoiceReason] = useState(undefined)

    const openReasonDialog = () => setIsDialogOpen(true);

    const closeReasonDialog = () => setIsDialogOpen(false);

    const cancelDialog = () => {
        closeReasonDialog();
        clearMultipleChoiceValues();

        getRestrictions(currentGuard, setSelectedDays);
        fetchAndUpdateGuards(setGuards);
    }

    useEffect(() => {
        clearMultipleChoiceValues();
        getRestrictions(currentGuard, setSelectedDays);
        fetchAndUpdateGuards(setGuards);
    }, [currentGuard])


    const clearMultipleChoiceValues = () => {
        setmultiplechoice(false);
        setMutipleChoiceReason(undefined);
    }

    useEffect(() => {
        if (multipleChoice) {
            setSelectedDays([]);
        }
    }, [multipleChoice])

    const toggleMultipleChoice = () => {
        // if were already togeled and instead of adding the multiple restrictions toggled off clear selectedDays and mutiplechoiceReason
        if(multipleChoice){
            setMutipleChoiceReason(undefined);
            getRestrictions(currentGuard, setSelectedDays);
            fetchAndUpdateGuards(setGuards);
        }
        setmultiplechoice(!multipleChoice);
    };

    useEffect(() => {
        if (multipleChoice) {
            openReasonDialog();
        }
    }, [multipleChoice])

    return (
        <>
            <ToggleButton
                color="primary"
                value="check"
                selected={multipleChoice}
                onChange={toggleMultipleChoice}
            >
                <CheckUncheckIcon multipleChoice={multipleChoice} />
                הסתייגות מרובת ימים
            </ToggleButton>
            <RestrictionReasonDialog
                selectedDays={selectedDays}
                setSelectedDays={setSelectedDays}
                pressedDateCell={pressedDateCell}
                isDialogOpen={isDialogOpen}
                handleClose={closeReasonDialog}
                cancelDialog={cancelDialog}
                multipleChoice={multipleChoice}
                setMutipleChoiceReason={setMutipleChoiceReason}
            />
            <CustomizedDayPicker
                currentGuard={currentGuard}
                multipleChoice={multipleChoice}
                selectedDays={selectedDays}
                setSelectedDays={setSelectedDays}
                setPressedDateCell={setPressedDateCell}
                openReasonDialog={openReasonDialog}
                mutiplechoiceReason={mutipleChoiceReason}
                clearMultipleChoiceValues={clearMultipleChoiceValues}
            />
        </>
    )
}
