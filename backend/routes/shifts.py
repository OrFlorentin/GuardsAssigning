import datetime
import itertools
from typing import List, Optional, Dict

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Depends

from constants.permissions import Action
from models.score import ScoreDeltaModel
from models.shift import ShiftModel
from models.structs import Date, PopulationType, UserKey
from models.user import UserModel
from routes.users import get_user_by_id
from utils.authorization_utils import Permission, get_active_user

router = APIRouter(prefix="/shifts", tags=["Shifts"], dependencies=[Depends(get_active_user)])


async def get_shift_by_id(shift_id: PydanticObjectId) -> ShiftModel:
    shift = await ShiftModel.get(shift_id)
    if shift is None:
        raise HTTPException(status_code=404, detail="Shift not found")
    return shift


async def get_shift_model(shift: ShiftModel):
    return shift


@router.get("/", response_model=List[ShiftModel])
async def get_shifts(start_date: Optional[Date] = None,
                     end_date: Optional[Date] = None,
                     branch_name: Optional[str] = None,
                     user_id: Optional[UserKey] = None,
                     population_type: Optional[PopulationType] = None):

    shifts = await ShiftModel.get_shifts(start_date=start_date,
                                         end_date=end_date,
                                         branch_name=branch_name,
                                         user_id=user_id,
                                         population_type=population_type)
    return shifts


@router.get("/by_date/", response_model=Dict[datetime.date, List[ShiftModel]])
async def group_shifts_by_date(start_date: Optional[Date] = None,
                               end_date: Optional[Date] = None):
    """
    Retrieve mapping of each date to all shifts in that date
    :param start_date: limit results to shifts from this date
    :param end_date: limit results to shifts until this date (inclusive)
    :return: dict with mapping of each date to all shifts in that date
    """
    filters = []
    if start_date is not None:
        filters.append(ShiftModel.date >= start_date)
    if end_date is not None:
        filters.append(ShiftModel.date <= end_date)

    return_dict = {}
    shifts = await ShiftModel.find(*filters).sort("+date").to_list()
    for date, grouped_shifts in itertools.groupby(shifts, key=lambda shift: shift.date.date()):
        return_dict[date] = list(grouped_shifts)

    return return_dict


@router.put("/", response_model=ShiftModel)
async def create_shift(shift: ShiftModel = Permission(Action.Create, get_shift_model)):
    """
    Create a ShiftModel object in DB
    :param shift: a ShiftModel object
    :return: details saved shift in DB
    """
    await shift.create()
    if shift.assigned_user_id is not None:
        user = await get_user_by_id(shift.assigned_user_id)
        await user.recalculate_score(population_type=shift.population_type)
    return shift


@router.put("/{shift_id}", response_model=ShiftModel)
async def edit_shift(new_shift: ShiftModel, old_shift: ShiftModel = Permission(Action.Edit, get_shift_by_id)):
    """
    Edit a ShiftModel object in DB
    :param new_shift: new shift details
    :param old_shift: old shift fetched from the DB
    :return: details saved shift in DB
    """
    # TODO: Restrict BranchManagers from altering shift's population fields (branch and population type)
    assert new_shift.id == old_shift.id, "Shift ID mismatch"
    await new_shift.replace()

    # TODO: Check there is no population mismatch that could cause error before comitting the shift to db.
    if old_shift.assigned_user_id is not None:
        user = await get_user_by_id(old_shift.assigned_user_id)
        await user.recalculate_score(population_type=old_shift.population_type)
    if new_shift.assigned_user_id is not None:
        user = await get_user_by_id(new_shift.assigned_user_id)
        await user.recalculate_score(population_type=new_shift.population_type)
    return new_shift


@router.delete("/{shift_id}", response_model=ShiftModel)
async def delete_shift(shift: ShiftModel = Permission(Action.Delete, get_shift_by_id)):
    """
    Delete a ShiftModel object in DB
    :param shift: shift fetched from the DB
    :return: details about deletion result
    """
    await shift.delete()
    if shift.assigned_user_id is not None:
        user = await get_user_by_id(shift.assigned_user_id)
        await user.recalculate_score(population_type=shift.population_type)
    return shift


@router.patch("/{shift_id}/assign_user", response_model=ShiftModel)
async def assign_user_to_shift(shift: ShiftModel = Permission(Action.Assign, get_shift_by_id),
                               user: UserModel = Permission(Action.Assign, get_user_by_id)):
    """
    Assign user to shift
    :param user: user that will be assigned to shift
    :param shift: shift to assign to user
    :return: assigned shift
    """

    if shift.branch != user.branch:
        raise HTTPException(status_code=500, detail="Guard and shift are from different branches")

    await shift.change_assigned_guard(new_assigned_user_id=user.id)
    return shift


@router.post("/default_score", response_model=ScoreDeltaModel)
async def get_default_score(shift: ShiftModel):
    """
    Get default score for shift by selected guard
    :param shift: shift to get default score for
    :return: default score for shift
    """
    return await shift.default_score()
