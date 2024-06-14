import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useAppContext } from './AppContext';
import { getManagedBranches } from './Utils';

export default function ManagedBranchesToggle(props) {
    const {
        branches,
        filteredBranch,
        setFilteredBranch,
        currentUser
    } = useAppContext();

    const [relevantBranches, setRelevantBranches] = useState([]);

    useEffect(() => {
        if (branches) {
            const managedBranches = getManagedBranches(currentUser, branches);
            setRelevantBranches(managedBranches);
        }
    }, [branches]);

    const setDefaultFilteredBranch = () => {
        if (relevantBranches.length > 0) {
            if (!filteredBranch || !relevantBranches.find(branch => branch._id === filteredBranch)) {
                setFilteredBranch(relevantBranches[0]?._id);
            }
        }
    };

    useEffect(() => {
        if (relevantBranches) {
            setDefaultFilteredBranch();
        }
    }, [relevantBranches]);


    return (
        <ToggleButtonGroup
            exclusive
            value={filteredBranch}
            {...props}
        >
            {relevantBranches.map((branch, index) => (
                <ToggleButton key={index} value={branch?._id}>
                    {branch?.name}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}
