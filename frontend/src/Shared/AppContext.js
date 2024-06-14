import React, { useState, createContext, useContext, useEffect } from 'react';
import { UserRole } from './Enums';
import { updateIsLoggedIn, reloadCurrentUser } from './LoginUtils';
import { getScoreSchema, isUserRoleIn, getManagedBranches } from './Utils';


const axios = require('axios');

const AppContext = createContext({});

export default function AppContextProvider({ children }) {
    const [guards, setGuards] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [shiftTypes, setShiftTypes] = useState([]);
    const [scoreSchemas, setScoreSchemas] = useState([]);
    const [populationTypes, setPopulationTypes] = useState([]);
    const [userRoles, setUserRoles] = useState([]);
    const [managedBranches, setManagedBranches] = useState([]);

    const [defaultConstraints, setDefaultConstraints] = useState([]);

    const [branchColors, setBranchColors] = useState([]);
    const [filteredBranch, setFilteredBranch] = useState(undefined);
    const [filteredPopulationType, setFilteredPopulationType] = useState(undefined);
    const [filteredGuards, setFilteredGuards] = useState(guards);
    const [currentScoreSchema, setCurrentScoreSchema] = useState(undefined);
    const [filteredShiftType, setFilteredShiftType] = useState(undefined);

    const hasToken = !!localStorage.getItem('token');
    const [isLoggedIn, setIsLoggedIn] = useState(hasToken);
    const [currentUser, setCurrentUser] = useState(undefined);
    const [hasFirstAcknowledgeReceived, setHasFirstAcknowledgeReceived] = useState(false);

    useEffect(() => {
        axios.get('/users/').then((response) => {
            setGuards(response.data);
        });
        axios.get('/shifts/').then((response) => {
            setShifts(response.data);
        });
        axios.get('/branches/').then((response) => {
            setBranches(response.data);
        });
        axios.get('/shift_types/').then((response) => {
            setShiftTypes(response.data);
        });
        axios.get('/score_table_schemas/').then((response) => {
            setScoreSchemas(response.data);
        });
        axios.get('/population_types/').then((response) => {
            setPopulationTypes(response.data);
        });
        axios.get('/roles/').then((response) => {
            setUserRoles(response.data);
        });
        axios.get('/assignments_model/default_constraints/').then((response) => {
            setDefaultConstraints(response.data);
        });
    }, [currentUser]);

    useEffect(() => {
        const branchTuples = branches.map((branch) => [branch._id, branch.color]);
        const branchColors = Object.fromEntries(branchTuples);

        setBranchColors(branchColors);
    }, [branches]);

    const updateFilteredGuards = () => {
        let filteredGuards = guards;

        if (filteredBranch) {
            filteredGuards = filteredGuards.filter((guard) => guard.branch === filteredBranch);
        }

        if (filteredPopulationType) {
            filteredGuards = filteredGuards.filter((guard) => guard.population_types.includes(filteredPopulationType));
        }

        setFilteredGuards(filteredGuards);
    };

    const updateCurrentScoreSchema = () => {
        setCurrentScoreSchema(getScoreSchema(filteredBranch, filteredPopulationType, branches, scoreSchemas));
    };

    const updateDefaultFilteredValues = () => {
        if (currentUser && branches && populationTypes && !isUserRoleIn(currentUser, [UserRole.ADMIN])) {
            setFilteredBranch(currentUser.branch);
            if (currentUser.population_types.length == 1) {
                setFilteredPopulationType(currentUser.population_types[0]);
            }
        }
    };

    const updateManagedBranches = () => {
        if (currentUser && branches) {
            const managedBranches = getManagedBranches(currentUser, branches);
            setManagedBranches(managedBranches);
        }
    };

    useEffect(updateFilteredGuards, [guards, filteredBranch, filteredPopulationType]);
    useEffect(updateCurrentScoreSchema, [branches, scoreSchemas, filteredBranch, filteredPopulationType]);
    useEffect(updateDefaultFilteredValues, [currentUser, branches, populationTypes]);
    useEffect(updateManagedBranches, [currentUser, branches]);

    useEffect(() => {
        reloadCurrentUser(setCurrentUser, setHasFirstAcknowledgeReceived)
    }, []);

    useEffect(
        () => updateIsLoggedIn(hasFirstAcknowledgeReceived, currentUser, setIsLoggedIn),
        [hasFirstAcknowledgeReceived, currentUser]
    );

    return (
        <AppContext.Provider
            value={{
                guards,
                setGuards,
                shifts,
                setShifts,
                branches,
                setBranches,
                managedBranches,
                shiftTypes,
                setShiftTypes,
                scoreSchemas,
                populationTypes,
                userRoles,
                defaultConstraints,
                branchColors,
                filteredBranch,
                setFilteredBranch,
                filteredPopulationType,
                setFilteredPopulationType,
                filteredGuards,
                currentScoreSchema,
                filteredShiftType,
                setFilteredShiftType,
                isLoggedIn,
                currentUser,
                setCurrentUser,
                setHasFirstAcknowledgeReceived,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export const useAppContext = () => useContext(AppContext);
