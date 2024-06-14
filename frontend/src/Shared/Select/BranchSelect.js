import React from 'react';
import { useAppContext } from '../AppContext';
import SelectFilter from './SelectFilter';

export default function BranchSelect() {
    const { branches, setFilteredBranch, filteredBranch } = useAppContext();

    return (
        <SelectFilter
            objects={branches}
            currentObject={filteredBranch}
            setCurrentObject={setFilteredBranch}
            title={'קבוצה'}
            allObjectsTitle={'כל הקבוצות'}
        />
    );
}
