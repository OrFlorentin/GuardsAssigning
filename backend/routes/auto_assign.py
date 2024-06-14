from typing import List, Union

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi_permissions import Allow, has_permission, permission_exception

from assignments_model.constraints import SpecificShiftsInServiceConstraint, GuardsPerShiftConstraint, \
    NoSpecificDayAfterSpecificDayConstraint, SpecificDayPerGuardPerMonthConstraint, \
    LimitRealOfficerGuardingGroupPerMonthConstraint, ShiftsPerGuardPerMonthConstraint, ShiftsPerGuardPerDayConstraint, \
    LimitOnlyOneHolidayInService, NoSpecificShiftsAfterSpecificShiftsConstraint, \
    SpecificDayPerGuardPerMonthWithHistoryConstraint
from assignments_model.models import OfficersRegularModel, OfficersWeekendModel, HogersWeekendModel, HogersRegularModel
from auto_assign import auto_assign_shifts
from constants.permissions import Role, Action
from models.branch import BranchModel
from models.permissions import UserRole, RoleManagerParameters
from models.shift import ShiftModel
from models.structs import PopulationType
from models.user import UserModel
from models.utils import user_role_to_string
from utils.authorization_utils import Permission, get_active_user

router = APIRouter(prefix="/assignments_model",
                   tags=["Auto Assignment"],
                   dependencies=[Depends(get_active_user)])
DefaultAssignACL = [
    (Allow, user_role_to_string(role=Role.Admin), Action.Assign)
]

CONSTRAINTS_UNION = Union[
    GuardsPerShiftConstraint,
    LimitOnlyOneHolidayInService,
    LimitRealOfficerGuardingGroupPerMonthConstraint,
    NoSpecificDayAfterSpecificDayConstraint,
    NoSpecificShiftsAfterSpecificShiftsConstraint,
    ShiftsPerGuardPerDayConstraint,
    ShiftsPerGuardPerMonthConstraint,
    SpecificDayPerGuardPerMonthConstraint,
    SpecificDayPerGuardPerMonthWithHistoryConstraint,
    SpecificShiftsInServiceConstraint
]


async def get_branch_by_id(branch_id: PydanticObjectId) -> BranchModel:
    branch = await BranchModel.get(branch_id)
    if branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch


async def has_permission_to_auto_assign(population_type: PopulationType,
                                        user: UserModel = Depends(get_active_user),
                                        branch: BranchModel = Depends(get_branch_by_id)):
    auto_assign_acl = [
        (Allow, user_role_to_string(role=Role.Admin), Action.Assign),
        (Allow, UserRole(role=Role.Manager,
                         extra_parameters=RoleManagerParameters(
                             branch=branch.id,
                             population_type=population_type.value
                         )).to_string(), Action.Assign),
    ]

    if not has_permission(user_principals=user.principals,
                          requested_permission=Action.Assign,
                          resource=auto_assign_acl):
        raise permission_exception


@router.post("/", response_model=List[ShiftModel], dependencies=[Depends(has_permission_to_auto_assign)])
async def auto_assign(
        population_type: PopulationType,
        db_shifts_ids: List[PydanticObjectId],
        db_users_ids: List[PydanticObjectId],
        constraints: List[CONSTRAINTS_UNION],
        overwrite_manual_assignments: bool,
        branch: BranchModel = Depends(get_branch_by_id),
):
    """
    Assign shifts to guards with automatic assignments model
    :param branch: branch of guards to assign
    :param population_type: population type of guards and shifts
    :param db_shifts_ids: ids of ShiftModel objects in DB
    :param db_users_ids: ids of UserModel objects in DB
    :param constraints: List of constraint objects that should be enforced in the model
    :param overwrite_manual_assignments: whether already assigned shifts should be reassigned
    :return: list of assigned shifts
    """
    # TODO make it receive weekend constraints and regular constraints

    return await auto_assign_shifts(
        db_shifts_ids=db_shifts_ids,
        db_users_ids=db_users_ids,
        overwrite_manual_assignments=overwrite_manual_assignments,
        population_type=population_type,
        constraints=constraints,
        branch=branch
    )


@router.post("/clear_all_assignments", dependencies=[Permission(Action.Assign, DefaultAssignACL)])
async def clear_all_assignments():
    """
    Clear all assignments from DB by putting null in ShiftModel.assigned_user_id attribute
    """
    # TODO: only delete assignments that a user (shift manager) owns
    await ShiftModel.find(ShiftModel.assigned_user_id != None).set({ShiftModel.assigned_user_id: None})


@router.get("/default_constraints/", response_model_exclude_none=True)
async def get_site_default_constraints():
    return {
        "HogerRegular": HogersRegularModel.get_default_constraints(),
        "HogerWeekend": HogersWeekendModel.get_default_constraints(),
        "OfficerRegular": OfficersRegularModel.get_default_constraints(),
        "OfficerWeekend": OfficersWeekendModel.get_default_constraints()
    }
