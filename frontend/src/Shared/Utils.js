import moment from 'moment';
import { UserRole } from './Enums';

export const isMobile = () => {
    return window.matchMedia("only screen and (max-width: 900px)").matches;
}

export function getDateDay(dateString) {
    if (!dateString) {
        return;
    }

    const [dateDay] = dateString.split('T');
    return dateDay;
}

export function formatDate(dateString) {
    return moment(dateString).format('DD/MM/YYYY');
}

export function getBranchName(branch_id, branches) {
    if (branch_id !== undefined && branches) {
        return branches.find((branch) => branch._id === branch_id)?.name;
    }
}

export function getShiftsForDate(shifts, date) {
    const filteredDate = getDateDay(date);
    const shiftsForDate = shifts.filter((shift) => getDateDay(shift.date) === filteredDate);

    return shiftsForDate;
}

export function getShiftGuard(shift, guards) {
    if (shift.assigned_user_id !== undefined) {
        return guards.find((guard) => guard._id === shift.assigned_user_id);
    }
}

export function getShiftBranch(shift, branches) {
    if (shift.branch !== undefined) {
        return branches.find((branch) => branch._id === shift.branch);
    }
}

export function getShiftTitle(shift, guards, branches) {
    return getShiftGuard(shift, guards)?.name || getShiftBranch(shift, branches)?.name || '';
}

export function getGuardShifts(guard, allShifts) {
    return allShifts.filter((shift) => shift.assigned_user_id === guard?._id &&
        moment(shift.date).isAfter(moment().subtract(1, "days")));
}

export function getShiftType(shift, allTypes) {
    return allTypes.find((shiftType) => shift.shift_type === shiftType._id);
}

export function getShiftTypeByID(shiftTypeID, allTypes) {
    return allTypes.find((type) => type?._id === shiftTypeID);
}

export function filterGuards(allGuards, branchName, populationType) {
    const guards = allGuards.filter((guard) => guard.population_types.includes(populationType));

    if (!branchName) {
        return guards;
    }

    return guards.filter((guard) => guard.branch === branchName);
}

export function getGuardPopulationSettings(guard, selectedPopulationType) {
    return guard?.population_settings.find(
        (populationSettings) => populationSettings?.population_type === selectedPopulationType
    );
}

export function getDefaultPopulationType(guard) {
    return guard?.population_types[0];
}

export function getGuardDefaultPopulationSettings(guard) {
    const defaultPopulationType = getDefaultPopulationType(guard);

    return getGuardPopulationSettings(guard, defaultPopulationType);
}

// TODO: Handle guards with multiple population types.
export function getOnlyPopulationSettingsAndAlert(guard, showWarningSnackbar) {
    if (guard?.population_types.length > 1 && showWarningSnackbar) {
        showWarningSnackbar(
            'get-only-population-failed',
            'Warning: One of the guards has more than one population type.'
        );
    }

    return getGuardDefaultPopulationSettings(guard);
}

export function getScoreSchema(selectedBranch, selectedPopulationType, allBranches, allScoreSchemas) {
    if (!selectedBranch || !selectedPopulationType || !allBranches || !allScoreSchemas) return;

    const branch = allBranches.find((branch) => branch._id === selectedBranch);
    if (!branch) return;

    const selectedPopulationScoreProperties = branch.population_score_properties
        .find((populationScoreProperties) =>
            populationScoreProperties.population_type === selectedPopulationType
        );
    if (!selectedPopulationScoreProperties) return;

    const scoreType = selectedPopulationScoreProperties.score_type;
    if (!scoreType) return;

    return allScoreSchemas[scoreType];
}

export function capitalizeString(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function getEmptyValue(type) {
    if (type === 'number') return 0;
    if (type === 'boolean') return false;
    if (type === 'string') return '';
}

export function getHebrewDateText(date) {
    const yearDate = moment(date).format('DD/MM/YYYY');

    const weekday = moment(date).weekday();
    const hebrewWeekdays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

    const weekdayStr = `יום ${hebrewWeekdays[weekday]}׳`;

    return `${weekdayStr} ${yearDate}`;
}

export function filterShiftsByLocation(shifts, selectedLocation, shiftTypes) {
    return shifts.filter((shift) => getShiftType(shift, shiftTypes)?.location === selectedLocation);
}

export function filterShiftsByShiftType(shifts, selectedShiftType) {
    return shifts.filter((shift) => shift.shift_type === selectedShiftType._id);
}

// The role string format is 'role:<role name>:<optional extra parameters>'.
// Role name must be from the Role Enum.
// Some roles require extra parameters that are supplied in a parameter string e.g.:
// 'key1=value1&key2=value2'
const ROLE = 'role';
const ROLE_DELIMITER = ':';
export function parseRoleString(role_str) {
    let result = {};
    const role_components = role_str.split(ROLE_DELIMITER);
    result.role = role_components[1];
    if (role_components.length == 3) {
        result.extra_parameters = {};
        for (const param of role_components[2].split('&')) {
            const [key, value] = param.split('=');
            result.extra_parameters[key] = value;
        }
    }
    return result;
}

export function isUserRoleIn(user, userRoles) {
    if (user) {
        for (const role_str of user?.roles) {
            const user_role = parseRoleString(role_str);
            if (userRoles.includes(user_role.role)) {
                return true;
            }
        }
    }
    return false;
}

export function isBranchManager(user) {
    return isUserRoleIn(user, [UserRole.BRANCH_MANAGER, UserRole.ADMIN]);
}

export function isAdmin(user) {
    return isUserRoleIn(user, [UserRole.ADMIN]);
}

export function isBranchManagerOf(user, branch_id, population_type) {
    if (user) {
        if (isAdmin(user)) {
            return true
        };
        
        for (const role_str of user?.roles) {
            const user_role = parseRoleString(role_str);
            if (user_role.role === UserRole.BRANCH_MANAGER 
                && user_role.extra_parameters.branch === branch_id 
                && (population_type === undefined || user_role.extra_parameters.population_type === population_type)) {
                return true;
            }
        }
    }
    return false;
}

export function getManagedBranches(user, branches) {
    return branches.filter(branch => isBranchManagerOf(user, branch._id));
}

export function getManagedPopulationTypesForBranch(user, branch, populationTypes) {
    return populationTypes.filter(populationType => isBranchManagerOf(user, branch, populationType));
}

export function safelyDeleteObjectFromList(objects, findFunction) {
    const newObjects = [...objects];

    return deleteObjectFromList(newObjects, findFunction);
}

export function deleteObjectFromList(objects, findFunction) {
    const index = objects.findIndex(findFunction);

    if (index >= 0) {
        objects.splice(index, 1);
    }

    return objects;
}

export function isSameDate(date1, date2) {
    return moment(date1).diff(date2) === 0;
}

export function replaceObjectInList(objects, findFunction, newObject) {
    const index = objects.findIndex(findFunction);

    if (index >= 0) {
        objects.splice(index, 1, newObject);
    }

    return objects;
}
