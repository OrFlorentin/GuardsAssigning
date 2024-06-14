from typing import List, Optional, Union

from beanie import PydanticObjectId
from beanie.odm.operators.find.comparison import In
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi_permissions import Authenticated, Allow
from pydantic import NonNegativeInt

from models.permissions import UserRole

from constants.constants import USER_NOT_FOUND
from constants.permissions import Role, Action
from models.score import ScoreModel
from models.structs import PopulationType, Date
from models.user import UserModel, DateRestrictionModel, OfficerGuardExtraParams, HogerGuardExtraParams
from models.utils import user_role_to_string
from utils.authorization_utils import get_active_user, Permission

router = APIRouter(prefix="/users", tags=["Users"], dependencies=[Depends(get_active_user)])
DefaultUsersACL = [
    (Allow, Authenticated, Action.View),
    (Allow, user_role_to_string(role=Role.Admin), Action.Edit),
    (Allow, user_role_to_string(role=Role.Admin), Action.Create),
    (Allow, user_role_to_string(role=Role.Admin), Action.Delete)
]


@router.get("/{user_id}", response_model=UserModel)
async def get_user_by_id(user_id: PydanticObjectId) -> UserModel:
    """
    Retrieve a UserModel object by its id
    :param user_id: id of user to retrieve
    :return: a UserModel object
    """
    user = await UserModel.get(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail=USER_NOT_FOUND)
    return user


async def get_user_model(user: UserModel):
    """
    Get User model.
    Useful when FastAPI dependency function needs the User model as param.
    :param user: User model object
    :return: User model object
    """
    return user


@router.put("/", response_model=UserModel)
async def save_user(user: UserModel = Permission(Action.CreateOrEdit, get_user_model)):
    """
    Create or edit a UserModel object in DB
    :param user: a UserModel object
    :return: details of saved user in DB
    """
    # TODO: Add route for weak creation/edit of user, so BranchManagers won't be able to modify website role and permissions
    if user.id:
        await user.recalculate_all_populations_score()
    await user.save()
    return user


@router.delete("/{user_id}", response_model=UserModel)
async def delete_user(user: UserModel = Permission(Action.Delete, get_user_by_id)):
    """
    Delete a UserModel object in DB
    :param user: user to delete
    :return: details about deletion result
    """
    await user.delete()
    return user


@router.get("/me/", response_model=UserModel)
async def get_my_user(user: UserModel = Depends(get_active_user)):
    """
    Retrieve a UserModel object by its id
    :param user: current active user
    :return: a UserModel object
    """
    return user


@router.get("/", response_model=List[UserModel], dependencies=[Permission(Action.View, DefaultUsersACL)])
async def get_users(branch_name: Optional[str] = None,
                    population_type: Optional[PopulationType] = None):
    """
    Get list of users in UserModel format
    :param branch_name: name of branch
    :param population_type: population type of users
    :return: list of users as they are saved in DB
    """
    filters = []
    if branch_name is not None:
        filters.append(UserModel.branch == branch_name)
    if population_type is not None:
        filters.append(In(population_type, UserModel.population_types))

    users = await UserModel.find(*filters).sort(UserModel.name).to_list()
    return users


async def add_restrictions_to_user(user: UserModel,
                                   population_type: PopulationType,
                                   new_restrictions: List[DateRestrictionModel]):
    """
    Add new restrictions to a user given its id
    :param user: user to add restrictions to
    :param population_type: type of population to add restrictions to
    :param new_restrictions: list of restrictions in DateRestrictionModel format
    :return: a UserModel object with updated restrictions
    """
    population_settings = user.get_population_settings(population_type=population_type)
    if population_settings is None:
        raise HTTPException(status_code=404, detail=f"User is not in '{population_type}' population")

    # TODO: add only non-duplicate restrictions
    population_settings.restrictions += new_restrictions

    await user.save()
    return user


async def update_user_restrictions(user: UserModel,
                                   population_type: PopulationType,
                                   restrictions: List[DateRestrictionModel]):
    """
    Replace a user's restrictions with given restrictions
    :param user: user to change restrictions
    :param population_type: type of population to change restrictions in
    :param restrictions:  list of restrictions in DateRestrictionModel format
    :return: a UserModel object with given restrictions
    """
    population_settings = user.get_population_settings(population_type=population_type)
    if population_settings is None:
        raise HTTPException(status_code=404, detail=f"User is not in '{population_type}' population")

    population_settings.restrictions = restrictions

    await user.save()
    return user


@router.get("/{user_id}/restrictions", response_model=List[DateRestrictionModel], tags=["Restrictions"])
async def get_restrictions(population_type: PopulationType,
                           user: UserModel = Permission(Action.View, get_user_by_id)):
    """
    Retrieve a UserModel restrictions array by guard's id
    :param population_type: population type of which the user has placed restrictions
    :param user: user with restrictions to retrieve
    :return: a UserModel restrictions for given population type
    """
    population_settings = user.get_population_settings(population_type=population_type)
    if population_settings is None:
        raise HTTPException(status_code=404, detail=f"User is not in '{population_type}' population")

    return population_settings.restrictions


@router.patch("/me/restrictions", response_model=UserModel, tags=["Restrictions"])
async def add_restrictions_to_me(population_type: PopulationType,
                                 new_restrictions: List[DateRestrictionModel],
                                 user: UserModel = Depends(get_active_user),
                                 ):
    """
    Add new restrictions to current user
    :param population_type: type of population to add restrictions to
    :param new_restrictions: list of restrictions in DateRestrictionModel format
    :param user: current active user
    :return: a UserModel object with updated restrictions
    """
    await add_restrictions_to_user(user=user, population_type=population_type, new_restrictions=new_restrictions)
    return user


@router.patch("/{user_id}/restrictions", response_model=UserModel, tags=["Admin", "Restrictions"])
async def add_restrictions(population_type: PopulationType,
                           new_restrictions: List[DateRestrictionModel],
                           user: UserModel = Permission(Action.ChangeRestrictions, get_user_by_id)
                           ):
    """
    Add new restrictions to a user given its id
    :param population_type: type of population to add restrictions to
    :param new_restrictions: list of restrictions in DateRestrictionModel format
    :param user: user to add restrictions to
    :return: a UserModel object with updated restrictions
    """
    await add_restrictions_to_user(user=user, population_type=population_type, new_restrictions=new_restrictions)
    return user


@router.put("/me/restrictions", response_model=UserModel, tags=["Restrictions"])
async def update_my_restrictions(population_type: PopulationType,
                                 restrictions: List[DateRestrictionModel],
                                 user: UserModel = Depends(get_active_user)):
    """
    Replace current user's restrictions with given restrictions
    :param user: current active user
    :param population_type: type of population to change restrictions in
    :param restrictions:  list of restrictions in DateRestrictionModel format
    :return: a UserModel object with given restrictions
    """
    await update_user_restrictions(user=user, population_type=population_type, restrictions=restrictions)
    return user


@router.put("/{user_id}/restrictions", response_model=UserModel, tags=["Admin", "Restrictions"])
async def update_restrictions(population_type: PopulationType,
                              restrictions: List[DateRestrictionModel],
                              user: UserModel = Permission(Action.ChangeRestrictions, get_user_by_id)):
    """
    Replace a user's restrictions with given restrictions
    :param population_type: type of population to change restrictions in
    :param restrictions:  list of restrictions in DateRestrictionModel format
    :param user: user to update restrictions
    :return: a UserModel object with given restrictions
    """
    await update_user_restrictions(user=user, population_type=population_type, restrictions=restrictions)
    return user


# TODO: Remove this! This is for testing purposes only
@router.get("/{user_id}/score", tags=["Admin", "Restrictions"]) # ,  response_model=ScoreModel)
async def update_score(population_type: PopulationType,
                       user: UserModel = Depends(get_user_by_id)) -> ScoreModel:
    """
    Calculate user's updated score
    :param population_type: type of population to calculate score for
    :param user: user to calculate score for
    :return: ScoreModel object with calculated score
    """
    score = await user.calculate_shifts_score(population_type=population_type)
    await user.update_score(population_type=population_type, score=score)
    return score


@router.post("/update_all_scores")
async def update_all_users_score():
    users = await UserModel.find_all().to_list()
    for user in users:
        for population_type in user.population_types:
            score = await user.calculate_shifts_score(population_type=population_type)
            await user.update_score(population_type=population_type, score=score)
    return None


@router.post("/{user_id}/update_population_settings")
async def update_population_settings(population_type: PopulationType,
                                     initial_score: ScoreModel,
                                     extra_params: Union[OfficerGuardExtraParams, HogerGuardExtraParams],
                                     score_multiplier: NonNegativeInt = Body(...),
                                     join_date: Date = Body(...),
                                     user: UserModel = Permission(Action.ChangeScore, get_user_by_id)):
    population_settings = user.get_population_settings(population_type=population_type)
    population_settings.initial_score = initial_score
    population_settings.score_multiplier = score_multiplier
    # TODO: check if population_type matches extra_params type
    population_settings.extra_params = extra_params
    population_settings.join_date = join_date
    await user.save()
    await user.recalculate_score(population_type=population_type)


@router.delete("/{user_id}/roles/{role_index}")
async def delete_user_role(role_index: int, user: UserModel = Permission(Action.Edit, get_user_by_id)):
    roles = user.roles
    if not 0 <= role_index <= (len(roles) - 1):
        raise HTTPException(status_code=404, detail=f"Role index {role_index} not found")
    
    deleted_role = roles.pop(role_index)
    await user.save()
    return deleted_role

@router.post("/{user_id}/roles")
async def add_role(role: UserRole, user: UserModel = Permission(Action.Edit, get_user_by_id)):
    await role.verify()
    user.roles.append(role.to_string())
    await user.save()
    return user
