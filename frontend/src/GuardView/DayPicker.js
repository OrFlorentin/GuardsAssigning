import React, { useMemo } from 'react'
import { DateUtils } from 'react-day-picker';
import { safelyDeleteObjectFromList } from '../Shared/Utils';
import BaseDayPicker from './RestrictionsUtils/Components/BaseDayPicker'

export default function DayPicker(
    {
        selectedDays,
        setSelectedDays,
        newlySelectedDays,
        setNewlySelectedDays,
        setHoveredDay,
    }
) {
    const getDateKey = (date) => date.toJSON();

    const selectedDaysMap = useMemo(
        () => {
            return [ ...selectedDays, ...newlySelectedDays].reduce((totalObject, currentDay) => {
                const dateKey = getDateKey(new Date(currentDay.date));

                return ({
                    ...totalObject,
                    [dateKey]: currentDay
                })
            }, {})
        }, [selectedDays, newlySelectedDays])

    const handleDayClick = (day, { disabled: dateNotAvailable }) => {
        if (dateNotAvailable) return;

        const alreadySelected = getDateKey(day) in selectedDaysMap;
        alreadySelected ? removeRestriction(day) : addRestriction(day);
    }

    const addRestriction = (day) => {
        const newDay = { date: day };
        setNewlySelectedDays([ ...newlySelectedDays, newDay ]);
        setHoveredDay(newDay);
    }

    const removeRestriction = (day) => {
        const findDay = (selectedDay) => DateUtils.isSameDay(new Date(selectedDay.date), day);

        setSelectedDays(safelyDeleteObjectFromList(selectedDays, findDay));
        setNewlySelectedDays(safelyDeleteObjectFromList(newlySelectedDays, findDay));
    }

    const onDayMouseEnter = (day) => {
        const hoveredDay = selectedDaysMap[getDateKey(day)];
        setHoveredDay(hoveredDay);
    }

    const toPickerDays = (days) => days.map(day => new Date(day.date));

    const modifiers = { newlySelectedDays: toPickerDays(newlySelectedDays) };

    return (
        <BaseDayPicker
            selectedDays={toPickerDays(selectedDays)}
            modifiers={modifiers}
            onDayClick={handleDayClick}
            onDayMouseEnter={onDayMouseEnter}
        />
    )
}
