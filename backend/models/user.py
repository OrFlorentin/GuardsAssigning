import math
from datetime import timedelta
from typing import List, Union, Optional

from beanie import Document, Indexed
from fastapi_permissions import Allow, Authenticated
from pydantic import validator
from pydantic.main import BaseModel

from assignments_model.entities import HogerGuard, OfficerGuard, BaseGuard
from models.utils import user_role_to_string
from models.permissions import RoleManagerParameters, UserRole
from constants.permissions import Role, Action
from models.branch import BranchKey
from models.score import ScoreModel, ScoreDeltaModel
from models.shift import ShiftModel
from models.structs import Date, PopulationType


class DateRestrictionModel(BaseModel):
    date: Date
    reason: Optional[str] = None


class HogerGuardExtraParams(BaseModel):
    num_holidays: int  # TODO: replace with number of past holidays in the system


class OfficerGuardExtraParams(BaseModel):
    num_holidays: int  # TODO: replace with number of past holidays in the system
    has_done_bhd1: bool


class PopulationSettings(BaseModel):
    population_type: PopulationType
    score_multiplier: int
    restrictions: List[DateRestrictionModel]
    extra_params: Union[OfficerGuardExtraParams, HogerGuardExtraParams]
    score: ScoreModel
    initial_score: ScoreModel
    join_date: Date


class UserModel(Document):
    username: Indexed(str, unique=True)
    name: str
    branch: BranchKey  # TODO: Validate the branch exists
    roles: List[str]
    population_types: List[PopulationType]
    population_settings: List[PopulationSettings]

    class Collection:
        name = "users"

    @property
    def principals(self) -> List[str]:
        """
        Get security principals for current user
        :return: list of security principals of user
        """
        return self.roles
    
    @validator('roles', each_item=True)
    def valid_roles(cls, role: str):
        UserRole.validate({'role_str': role})
        return role
    
    def time_in_duty(self, population_type: PopulationType) -> int:
        # Get time in duty in months by join_date and current date difference
        population_settings = self.get_population_settings(population_type=population_type)
        assert population_settings is not None, f"Couldn't find settings for population type {population_type} "
        join_date = population_settings.join_date
        current_date = Date.today()
        diff: timedelta = current_date - join_date
        months = max(1, math.ceil(diff.days / 30))
        return months

    def get_population_settings(self, population_type: PopulationType) -> Optional[PopulationSettings]:
        found_settings = [population_settings for population_settings in self.population_settings
                          if population_settings.population_type == population_type]
        assert len(
            found_settings) <= 1, "A user can't have more than one PopulationSettings for the same population_type"

        if len(found_settings) > 0:
            return found_settings[0]

        return None

    def to_guard(self, population_type: PopulationType) -> BaseGuard:
        """
        Convert DB guard object to assignments' model guard object according to the guard type
        :return: assignments' model guard object
        """

        settings = self.get_population_settings(population_type=population_type)
        assert settings is not None, f"Couldn't find settings for population type {population_type} " \
                                     f"for user '{self.username}'"

        restrictions = [restriction.date.date() for restriction in settings.restrictions]
        if isinstance(settings.extra_params, HogerGuardExtraParams):
            return HogerGuard(
                id_=self.id,
                name=self.name,
                time_in_duty=self.time_in_duty(population_type=population_type),
                score_multiplier=settings.score_multiplier,
                score=settings.score,
                num_holidays=settings.extra_params.num_holidays,
                restrictions=restrictions,
                previous_shifts=None,  # TODO: add history of shifts or a reduced form of history from DB
            )
        elif isinstance(settings.extra_params, OfficerGuardExtraParams):
            return OfficerGuard(
                id_=self.id,
                name=self.name,
                time_in_duty=self.time_in_duty(population_type=population_type),
                score_multiplier=settings.score_multiplier,
                score=settings.score,
                num_holidays=settings.extra_params.num_holidays,
                restrictions=restrictions,
                previous_shifts=None,  # TODO: add history of shifts or a reduced form of history from DB
                has_done_bhd1=settings.extra_params.has_done_bhd1,
            )
        raise ValueError("Unknown type of guard")

    async def get_initial_score(self, population_type: PopulationType) -> ScoreModel:
        """
        Get the initial score of the guard
        :param population_type: population type
        """
        settings = self.get_population_settings(population_type=population_type)
        return settings.initial_score

    async def calculate_shifts_score(self,
                                     population_type: PopulationType,
                                     start_date: Optional[Date] = None,
                                     end_date: Optional[Date] = None) -> ScoreModel:
        """
        Calculate the theoretic score for a guard's shifts in a given period of time
        :param start_date: start date of the period
        :param end_date: end date of the period
        :param population_type: population type
        :return: theoretic score for a guard's shifts in a given period of time
        """
        assert self.id is not None, "User must exist before calculating his score"
        shifts = await ShiftModel.get_shifts(start_date=start_date,
                                             end_date=end_date,
                                             user_id=self.id,
                                             population_type=population_type)

        new_initial_score = await self.get_initial_score(population_type=population_type)
        new_score = new_initial_score + sum([shift.score for shift in shifts], ScoreDeltaModel())

        return new_score

    async def update_score(self, population_type: PopulationType, score: ScoreModel):
        """
        Update the score of a guard
        :param population_type: population type
        :param score: new score
        """
        settings = self.get_population_settings(population_type=population_type)
        assert settings is not None, f"Couldn't find settings for population type {population_type} " \
                                     f"for user '{self.username}'"

        settings.score = score
        await self.save()

    async def recalculate_score(self, population_type: PopulationType):
        new_score = await self.calculate_shifts_score(population_type=population_type)
        await self.update_score(population_type=population_type, score=new_score)

    async def recalculate_all_populations_score(self):
        for population_type in self.population_types:
            await self.recalculate_score(population_type)

    def __acl__(self):
        acl_list = [
            (Allow, Authenticated, Action.View),
            (Allow, user_role_to_string(role=Role.Admin), Action.Create),
            (Allow, user_role_to_string(role=Role.Admin), Action.Edit),
            (Allow, user_role_to_string(role=Role.Admin), Action.CreateOrEdit),
            (Allow, user_role_to_string(role=Role.Admin), Action.Delete),
            (Allow, user_role_to_string(role=Role.Admin), Action.Assign),
            (Allow, user_role_to_string(role=Role.Admin), Action.ChangeScore),
            (Allow, user_role_to_string(role=Role.Admin), Action.ChangeRestrictions),
        ]

        for population_type in self.population_types:
            manager_role = user_role_to_string(
                role=Role.Manager,
                extra_parameters=RoleManagerParameters(
                    branch=self.branch,
                    population_type=population_type
                )
            )

            acl_list.append((Allow, manager_role, Action.CreateOrEdit))
            acl_list.append((Allow, manager_role, Action.Delete))
            acl_list.append((Allow, manager_role, Action.Assign))
            acl_list.append((Allow, manager_role, Action.ChangeScore))
            acl_list.append((Allow, manager_role, Action.ChangeRestrictions))

        return acl_list
