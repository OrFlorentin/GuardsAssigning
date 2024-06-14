from typing import List
from beanie import PydanticObjectId

from fastapi import HTTPException
from fastapi import APIRouter, Depends
from fastapi_permissions import Allow, Authenticated
from models.user import UserModel

from constants.permissions import Role, Action
from models.branch import BranchModel, BaseBranchModel, PopulationScoreProperties
from models.structs import PopulationType
from models.score_params import ScoreParamsType
from models.utils import user_role_to_string
from utils.authorization_utils import Permission, get_active_user

router = APIRouter(prefix="/branches", tags=["branches"], dependencies=[Depends(get_active_user)])
DefaultBranchesACL = [
    (Allow, Authenticated, Action.View),
    (Allow, user_role_to_string(role=Role.Admin), Action.Edit),
    (Allow, user_role_to_string(role=Role.Admin), Action.Create),
    (Allow, user_role_to_string(role=Role.Admin), Action.Delete)
]


async def get_branch_by_id(branch_id: PydanticObjectId) -> BranchModel:
    branch = await BranchModel.get(branch_id)
    if branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch


@router.get("/", response_model=List[BranchModel], dependencies=[Permission(Action.View, DefaultBranchesACL)])
async def get_all_branches():
    """
    Get list of all branches in BranchModel format
    :return: list of branches as they are saved in DB
    """
    branches = await BranchModel.find_all().sort(BranchModel.name).to_list()
    return branches


@router.put("/", response_model=BranchModel, dependencies=[Permission(Action.Create, DefaultBranchesACL)])
async def create_branch(base_branch: BaseBranchModel):
    """
    Create or edit a BranchModel object in DB
    :param branch: a BaseBranchModel object
    :return: details saved branch in DB
    """
    branch = BranchModel.from_base_branch(base_branch)
    await branch.create()
    return branch


@router.patch("/{branch_id}", response_model=BranchModel)
async def edit_branch(new_base_branch: BaseBranchModel,
                      old_branch: BranchModel = Permission(Action.Edit, get_branch_by_id)):
    """
    Edit a ShiftTypeModel object in DB
    :param new_shift_type: new shift type details
    :param old_shift_type: old shift type fetched from the DB
    :return: details saved shift type in DB
    """
    new_branch = BranchModel.from_base_branch(new_base_branch)
    new_branch.id = old_branch.id

    await new_branch.replace()
    return new_branch


@router.delete("/{branch_id}", response_model=BranchModel)
async def delete_shift_type(branch: BranchModel = Permission(Action.Delete, get_branch_by_id)):
    """
    Delete a ShiftTypeModel object in DB
    :param shift_type: shift type fetched from the DB
    :return: details about deletion result
    """
    if await UserModel.find_one(UserModel.branch == branch.id) is not None:
        raise HTTPException(status_code=423, detail='Cannot delete branch with users')

    await branch.delete()
    return branch
