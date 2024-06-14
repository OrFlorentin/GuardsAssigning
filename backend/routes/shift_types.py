from http.client import HTTPException
from typing import List

from fastapi import APIRouter, Depends
from fastapi_permissions import Allow, Authenticated

from beanie import PydanticObjectId

from constants.permissions import Role, Action
from models.shift_type import ShiftTypeModel
from models.utils import user_role_to_string
from utils.authorization_utils import get_active_user, Permission

router = APIRouter(prefix="/shift_types", tags=["Shift Types"], dependencies=[Depends(get_active_user)])

ShiftTypesACL = [
    (Allow, Authenticated, Action.View),
    (Allow, user_role_to_string(role=Role.Admin), Action.Edit),
    (Allow, user_role_to_string(role=Role.Admin), Action.Create),
    (Allow, user_role_to_string(role=Role.Admin), Action.Delete)
]

async def get_shift_type_by_id(shift_type_id: PydanticObjectId) -> ShiftTypeModel:
    shift_type = await ShiftTypeModel.get(shift_type_id)
    if shift_type is None:
        raise HTTPException(status_code=404, detail="Shift Type not found")
    return shift_type

@router.get("/", response_model=List[ShiftTypeModel], dependencies=[Permission(Action.View, ShiftTypesACL)])
async def get_all_shift_types():
    shift_types = await ShiftTypeModel.find_all().to_list()
    return shift_types


@router.put("/", response_model=ShiftTypeModel, dependencies=[Permission(Action.Create, ShiftTypesACL)])
async def create_shift_type(shift_type: ShiftTypeModel):
    """
    Create or edit a ShiftTypeModel object in DB
    :param shift_type: a ShiftTypeModel object
    :return: whether saved shift type in db
    """
    await shift_type.save()
    return shift_type

@router.put("/{shift_type_id}", response_model=ShiftTypeModel)
async def edit_shift_type(new_shift_type: ShiftTypeModel, old_shift_type: ShiftTypeModel = Permission(Action.Edit, get_shift_type_by_id)):
    """
    Edit a ShiftTypeModel object in DB
    :param new_shift_type: new shift type details
    :param old_shift_type: old shift type fetched from the DB
    :return: details saved shift type in DB
    """
    if new_shift_type.id != old_shift_type.id:
        raise HTTPException(status_code=422, detail="Shift Type ID mismatch")
    
    await new_shift_type.replace()
    return new_shift_type

@router.delete("/{shift_type_id}", response_model=ShiftTypeModel)
async def delete_shift_type(shift_type: ShiftTypeModel = Permission(Action.Delete, get_shift_type_by_id)):
    """
    Delete a ShiftTypeModel object in DB
    :param shift_type: shift type fetched from the DB
    :return: details about deletion result
    """
    await shift_type.delete()
    return shift_type
