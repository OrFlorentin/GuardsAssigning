from datetime import timedelta
from typing import Optional

from beanie import Document
from fastapi_permissions import Allow, Authenticated

from assignments_model.entities import Shift
from models.utils import user_role_to_string
from models.permissions import RoleManagerParameters
from constants.permissions import Role, Action
from models.branch import BranchKey
from models.score import ScoreDeltaModel, DayTypeEnum
from models.shift_type import ShiftTypeKey, ShiftTypeModel
from models.structs import Date, PopulationType, UserKey


class ShiftModel(Document):
    date: Date
    shift_type: ShiftTypeKey
    population_type: PopulationType
    branch: BranchKey  # TODO: Validate the branch exists
    order: Optional[int] = 0
    num_days: Optional[int] = 1
    assigned_user_id: Optional[UserKey] = None
    is_holiday: bool
    score: ScoreDeltaModel
    is_custom_score: bool

    class Collection:
        name = "shifts"

    async def to_shift(self) -> Shift:
        """
        Convert DB shift object to assignments' model Shift object
        :return: assignments' model Shift object
        """
        shift_type_model = await ShiftTypeModel.get(self.shift_type)
        date = self.date.date()

        return Shift(
            date=date,
            shift_type=shift_type_model,
            is_holiday=self.is_holiday,
            num_days=self.num_days,
            score=self.score,
            id_=self.id
        )

    @classmethod
    async def get_shifts(cls,
                         start_date: Optional[Date] = None,
                         end_date: Optional[Date] = None,
                         branch_name: Optional[str] = None,
                         user_id: Optional[UserKey] = None,
                         population_type: Optional[PopulationType] = None):
        """
        Get all shifts by given criteria
        :param start_date: limit results to shifts from this date
        :param end_date: limit results to shifts until this date (inclusive)
        :param branch_name: limit results by shift's branch name
        :param user_id: filter shifts by specific user
        :param population_type: filter shifts by specific population type
        :return: list of shifts as they are saved in DB
        """
        filters = []
        if start_date is not None:
            filters.append(ShiftModel.date >= start_date)
        if end_date is not None:
            filters.append(ShiftModel.date <= end_date)
        if branch_name is not None:
            filters.append(ShiftModel.branch == branch_name)
        if user_id is not None:
            filters.append(ShiftModel.assigned_user_id == user_id)
        if population_type is not None:
            filters.append(ShiftModel.population_type == population_type)

        shifts = await cls.find(*filters).sort("+date").to_list()
        return shifts

    async def default_score(self) -> ScoreDeltaModel:
        """
        Default score for shift with given parameters
        :return: default score for given parameters
        """
        if not self.population_type:
            return ScoreDeltaModel()

        shift_type_model = await ShiftTypeModel.get(self.shift_type)
        
        # TODO: add holiday multiplier
        score = ScoreDeltaModel()
        for days in range(self.num_days):
            day_type = DayTypeEnum.from_date(self.date + timedelta(days=days))
            score += shift_type_model.get_default_score(day_type)
        
        # If there's a user assigned to this shift, consider its score multiplier
        if self.assigned_user_id:
            from models.user import UserModel
            guard = await UserModel.get(self.assigned_user_id)
            assert guard is not None, "Couldn't find assigned guard"
            population_settings = guard.get_population_settings(population_type=self.population_type)
            assert population_settings is not None, f"Couldn't find population settings for {self.population_type}"
            score *= population_settings.score_multiplier

        return score

    async def update_score(self, score: ScoreDeltaModel):
        """
        Update shift's score
        :param score: new score
        """
        self.score = score
        await self.save()

        if self.assigned_user_id:
            from models.user import UserModel
            guard = await UserModel.get(self.assigned_user_id)
            await guard.recalculate_score(population_type=self.population_type)

        return self.score

    async def change_assigned_guard(self, new_assigned_user_id: UserKey):
        """
        Update shift's score
        :param new_assigned_user_id: new assigned user id
        """

        old_assigned_user_id = self.assigned_user_id
        self.assigned_user_id = new_assigned_user_id
        await self.save()

        if old_assigned_user_id:
            from models.user import UserModel
            guard = await UserModel.get(old_assigned_user_id)
            await guard.recalculate_score(population_type=self.population_type)
        if self.assigned_user_id:
            from models.user import UserModel
            guard = await UserModel.get(self.assigned_user_id)
            await guard.recalculate_score(population_type=self.population_type)

        return self

    def __acl__(self):
        manager_role = user_role_to_string(
            role=Role.Manager,
            extra_parameters=RoleManagerParameters(
                branch=self.branch,
                population_type=self.population_type
            )
        )

        return [
            (Allow, Authenticated, Action.View),
            (Allow, manager_role, Action.Assign),
            (Allow, manager_role, Action.Edit),
            (Allow, user_role_to_string(role=Role.Admin), Action.Assign),
            (Allow, user_role_to_string(role=Role.Admin), Action.Edit),
            (Allow, user_role_to_string(role=Role.Admin), Action.Create),
            (Allow, user_role_to_string(role=Role.Admin), Action.Delete)
        ]
