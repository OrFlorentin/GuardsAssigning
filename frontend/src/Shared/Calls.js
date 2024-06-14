import axios from 'axios';
import { replaceObjectInList, getDefaultPopulationType } from './Utils';

export function updatePopulationSettings({guardId, populationType, updatePopulationSettingsRequest}) {
    return axios.post(`/users/${guardId}/update_population_settings`, updatePopulationSettingsRequest, {
        headers: {
            'content-type': 'application/json',
        },
        params: {
            population_type: populationType
        }
    });
}

export async function fetchAndUpdateBranches(setBranches) {
    return await axios.get('/branches/').then((response) => {
        setBranches(response.data);
    });
}

export function putBranch(branch) {
    return axios.put('/branches/', branch, {
        headers: {
            'content-type': 'application/json',
        }
    });
}

export function editBranch(branch_id, branch) {
    return axios.patch(`/branches/${branch_id}`, branch, {
        headers: {
            'content-type': 'application/json',
        }
    });
}

export function deleteBranch(branch_id) {
    return axios.delete(`/branches/${branch_id}`);
}

export function putGuard(guard) {
    return axios.put('/users/', guard, {
        headers: {
            'content-type': 'application/json',
        },
    });
}

export function deleteGuard(guardId) {
    return axios.delete(`/users/${guardId}`, {
        headers: {
            'content-type': 'application/json',
        },
    });
}

export function createShift(shift) {
    return axios.put('/shifts/', shift, {
        headers: {
            'content-type': 'application/json',
        },
    });
}

export function putShift(shift) {
    return axios.put(`/shifts/${shift?._id}`, shift, {
        headers: {
            'content-type': 'application/json',
        },
    });
}

export function deleteShift(shift_id) {
    return axios.delete(`/shifts/${shift_id}`, {
        headers: {
            'content-type': 'application/json',
        },
    });
}

export function putShiftType(shift_type) {
    return axios.put(`/shift_types/`, shift_type, {
        headers: {
            'content-type': 'application/json'
        }
    });
}

export function editShiftType(shift_type_id, shift_type) {
    return axios.put(`/shift_types/${shift_type_id}`, shift_type, {
        headers: {
            'content-type': 'application/json'
        }
    });
}

export function deleteShiftType(shift_type_id) {
    return axios.delete(`/shift_types/${shift_type_id}`);
}

export function deleteUserRole(user_id, role_index) {
    return axios.delete(`/users/${user_id}/roles/${role_index}`);
}

export function addUserRole(user_id, role) {
    return axios.post(`/users/${user_id}/roles`, role, {
        headers: {
            'content-type': 'application/json'
        }
    });
}

export function getCurrentUser() {
    return axios.get('/users/me/');
}

export function getLoginRedirectUrl() {
    return axios.post('/auth/login/');
}

export async function microsoftLogin(url) {
	window.location.href = url;
}

export function devLogin(formValues) {
    const data = new FormData();
    data.append('username', formValues.username);
    data.append('password', formValues.password)

    return axios.post('/dev/login', data);
}


// TODO: This function is called only after the current guard is updated. Fetch only the current guard.
export async function fetchAndUpdateGuards(setGuards) {
    return await axios.get('/users/').then((response) => {
        setGuards(response.data);
    });
}

export async function fetchAndUpdateCurrentGuard(setCurrentUser, setGuards) {
    return await getCurrentUser()
        .then((response) => response.data)
        .then((currentGuard) => {
            setCurrentUser(currentGuard);
            setGuards((prevGuards) => {
                return replaceObjectInList(
                    prevGuards,
                    (guard) => guard?._id === currentGuard._id,
                    currentGuard
                );
            });

            return currentGuard;
        });
}

export async function fetchAndUpdateShiftTypes(setShiftTypes) {
    return await axios.get('/shift_types/').then((response) => {
        setShiftTypes(response.data);
    });
}

export async function updateMyRestrictions(currentGuard, selectedDays) {
    const new_restrictions = selectedDays.map(day => ({ date: day.date, reason: day.reason }));

    const populationType = getDefaultPopulationType(currentGuard)

    return await axios.put('/users/me/restrictions', new_restrictions, {
        params: {
            population_type: populationType
        }
    });
}
