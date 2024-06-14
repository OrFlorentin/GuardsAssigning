from typing import Optional, Dict

from beanie import Document, PydanticObjectId
from fastapi import HTTPException
from pydantic import NonNegativeInt
from fastapi_permissions import Allow, Authenticated
from models.utils import user_role_to_string
from models.score import DayTypeEnum, ScoreDeltaModel

from constants.permissions import Role, Action
from models.structs import PopulationType, Location

REGULAR_DAYS = (DayTypeEnum.REGULAR_DAY, DayTypeEnum.THURSDAY)
WEEKEND_DAYS = (DayTypeEnum.WEEKEND,)

class ShiftTypeModel(Document):
    """
    Maximum number of shifts on a generic day in given base
    """
    __acl__ = [
        (Allow, Authenticated, Action.View),
        (Allow, user_role_to_string(role=Role.Admin), Action.Edit),
        (Allow, user_role_to_string(role=Role.Admin), Action.Create),
        (Allow, user_role_to_string(role=Role.Admin), Action.Delete)
    ]
    
    name: str
    description: Optional[str] = None
    slots_count: NonNegativeInt
    population_type: PopulationType
    location: Optional[Location]
    score_config: Dict[DayTypeEnum, float]

    class Collection:
        name = "shift_types"

    def get_default_score(self, day_type: DayTypeEnum) -> ScoreDeltaModel:
        if day_type not in self.score_config:
            raise HTTPException(status_code=422, 
                                detail=f'Default score is not configured for day type {day_type.name}')
        score = self.score_config[day_type]
        if day_type in WEEKEND_DAYS:
            return ScoreDeltaModel(weekend_score=score)
        else:
            return ScoreDeltaModel(regular_score=score)

ShiftTypeKey = PydanticObjectId
