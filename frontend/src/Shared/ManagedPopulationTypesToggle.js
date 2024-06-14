import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useAppContext } from './AppContext';
import { getManagedPopulationTypesForBranch, isBranchManagerOf } from './Utils';

export default function ManagedPopulationTypesToggle({ ...props }) {
    const {
        filteredBranch,
        populationTypes,
        filteredPopulationType,
        setFilteredPopulationType,
        currentUser
    } = useAppContext();

    const [relevantPopulationTypes, setRelevantPopulationTypes] = useState([]);

    useEffect(() => {
        if (filteredBranch && populationTypes) {
            const managedPopulationTypes = getManagedPopulationTypesForBranch(currentUser, filteredBranch, populationTypes);
            setRelevantPopulationTypes(managedPopulationTypes);
        }
    }, [filteredBranch, populationTypes]);

    const setDefaultFilteredPopulationType = () => {
        if (relevantPopulationTypes.length > 0) {
            setFilteredPopulationType(relevantPopulationTypes[0]);
        }
    };

    useEffect(() => {
        if (relevantPopulationTypes) {
            setDefaultFilteredPopulationType();
        }
    }, [relevantPopulationTypes]);


    return (
        <ToggleButtonGroup
            exclusive
            value={filteredPopulationType}
            {...props}
        >
            {relevantPopulationTypes.map((populationType, index) => (
                <ToggleButton key={index} value={populationType}>
                    {populationType}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}
