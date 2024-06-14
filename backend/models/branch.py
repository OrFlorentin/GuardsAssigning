from __future__ import annotations
from typing import List
from beanie import Indexed, Document, PydanticObjectId
from fastapi_permissions import Allow, Authenticated
from pydantic import Field, BaseModel
from models.utils import user_role_to_string

from constants.permissions import Role, Action
from models.structs import PopulationType
from models.score_params import ScoreParamsType

COLOR_REGEX = '#[0-9A-Fa-f]{6}'


class PopulationScoreProperties(BaseModel):
    population_type: PopulationType
    score_type: ScoreParamsType


class BaseBranchModel(BaseModel):
    name: Indexed(str, unique=True)
    color: str = Field(regex=COLOR_REGEX)


class BranchModel(BaseBranchModel, Document):
    __acl__ = [
        (Allow, Authenticated, Action.View),
        (Allow, user_role_to_string(role=Role.Admin), Action.Edit),
        (Allow, user_role_to_string(role=Role.Admin), Action.Create),
        (Allow, user_role_to_string(role=Role.Admin), Action.Delete)
    ]

    population_score_properties: List[PopulationScoreProperties]  # Properties of populationTypes inside the branch

    class Collection:
        name = "branches"
    
    @classmethod
    def from_base_branch(cls, base_branch: BaseBranchModel) -> BranchModel:
        population_score_properties = [
            PopulationScoreProperties(population_type=PopulationType.HOGER,
                                    score_type=ScoreParamsType.HOGER_PARAMS),
            PopulationScoreProperties(population_type=PopulationType.OFFICER,
                                    score_type=ScoreParamsType.OFFICER_PARAMS)
        ]
        branch_model = cls(
            population_score_properties=population_score_properties,
            **base_branch.dict()
        )
        return branch_model


# Key for BranchModel
BranchKey = PydanticObjectId
