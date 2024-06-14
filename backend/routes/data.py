from typing import List, Dict

from fastapi import APIRouter, Depends
from constants.permissions import Role

from models.structs import PopulationType, Location
from models.score_params import ScoreParamsType, TableSchema, score_type_to_table_schema
from utils.authorization_utils import get_active_user

router = APIRouter(tags=["Data"], dependencies=[Depends(get_active_user)])


@router.get("/population_types/", response_model=List[PopulationType])
async def get_population_types():
    population_types = [population_type.value for population_type in PopulationType]
    return population_types


@router.get("/locations/", response_model=List[Location])
async def get_locations():
    locations = [location.value for location in Location]
    return locations


@router.get("/roles/", response_model=List[Role])
async def get_roles():
    roles = [role.value for role in Role]
    return roles


@router.get("/score_table_schemas/", response_model=Dict[ScoreParamsType, TableSchema])
async def get_score_table_schemas():
    """
    Gets a mapping of score types to score table schemas.
    Each schema consists of a list of table column objects,
    and each object contains properties of the column, like id, type and display name
    :return: Score table schemas of all score types.
    """
    return score_type_to_table_schema
