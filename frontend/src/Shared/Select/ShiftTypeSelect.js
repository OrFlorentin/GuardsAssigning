import React from 'react';
import { useAppContext } from '../AppContext';
import SelectFilter from './SelectFilter';

export default function ShiftTypeSelect() {
    const { shiftTypes, filteredShiftType, setFilteredShiftType } = useAppContext();

    return (
        <SelectFilter
            objects={shiftTypes}
            currentObject={filteredShiftType}
            setCurrentObject={setFilteredShiftType}
            title={'סוג משחק'}
            allObjectsTitle={'כל סוגי המשחקים'}
        />
    );
}
