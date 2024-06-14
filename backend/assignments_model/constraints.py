from __future__ import annotations

from abc import abstractmethod, ABCMeta
from datetime import datetime, timedelta
from typing import List, TYPE_CHECKING, Union, Iterable, Literal

from pydantic.main import BaseModel

from assignments_model.entities import Shift, OfficerGuard, BaseGuard
from assignments_model.query import ShiftQuery, UnionQuery
from constants.constants import Weekday

if TYPE_CHECKING:
    from backend.assignments_model.models import GuardsAssignmentsModel, UnifiedScoreRegularModel, \
        UnifiedScoreWeekendsModel


class BaseConstraint(BaseModel, metaclass=ABCMeta):
    """
    An abstract class that represent a constraint
    """

    @abstractmethod
    def validate_parameters(self):
        """
        Raises an error on invalid parameters given to constraints
        """
        raise NotImplementedError

    @abstractmethod
    def apply_constraint(self, model: GuardsAssignmentsModel):
        """
        Applies current constraint to a given model
        :param model: a guards assignment model
        """
        raise NotImplementedError


class GuardsPerShiftConstraint(BaseConstraint):
    """
    A constraint for limiting the number of guards per shift (probably 1)
    """
    name: Literal["GuardsPerShiftConstraint"] = "GuardsPerShiftConstraint"
    guards_per_shift: int

    def __calc_sum(self, model: GuardsAssignmentsModel, shift: Shift) -> int:
        """
        Calculates the sum of guards of a given shift
        :param model:   the assignments model
        :param shift:   the shift to perform the calculation on
        :return:        the sum of guards of the given shift
        """
        return sum(model.assignment_vars[(shift, guard)] for guard in model.guards)

    def validate_parameters(self):
        if self.guards_per_shift < 1:
            raise ValueError(f"Invalid argument: guards_per_shift ({self.guards_per_shift}) is < 1")

    def apply_constraint(self, model: GuardsAssignmentsModel):
        for shift in model.shifts:
            model.model.Add(self.__calc_sum(model, shift) == self.guards_per_shift) \
                .OnlyEnforceIf(model.infeasibility_debug_var())


class ShiftsPerGuardPerDayConstraint(BaseConstraint):
    """
    A constraint for limiting the number of shifts for each guard on a certain day (probably 1)
    """
    name: Literal["ShiftsPerGuardPerDayConstraint"] = "ShiftsPerGuardPerDayConstraint"
    min_shifts_per_day: int
    max_shifts_per_day: int

    def __calc_sum(self, model: GuardsAssignmentsModel, guard: BaseGuard, day: datetime.date) -> int:
        """
        Calculates the sum of shifts for a given guard in a given day
        :param model:   the assignments model
        :param guard:   the guard to calculate the number of shifts for
        :param day:     the day to perform the calculation on
        :return:        the sum of shifts for the given guard in the given day
        """
        return sum(model.assignment_vars[(shift, guard)] for shift in model.shifts.find(date=day))

    def validate_parameters(self):
        if self.min_shifts_per_day < 0:
            raise ValueError(f"Invalid argument: min_shifts_per_day ({self.min_shifts_per_day}) is < 0")
        if self.max_shifts_per_day < 0:
            raise ValueError(f"Invalid argument: max_shifts_per_day ({self.max_shifts_per_day}) is < 0")
        if self.max_shifts_per_day < self.min_shifts_per_day:
            raise ValueError(f"Invalid arguments: max_shifts_per_day ({self.max_shifts_per_day}) is less "
                             f"than min_shifts_per_day ({self.min_shifts_per_day}")

    def apply_constraint(self, model: GuardsAssignmentsModel):
        for day in set(shift.date for shift in model.shifts):
            for guard in model.guards:
                calculated_sum = self.__calc_sum(model, guard, day)
                model.model.Add(calculated_sum <= self.max_shifts_per_day).OnlyEnforceIf(
                    model.infeasibility_debug_var())
                model.model.Add(calculated_sum >= self.min_shifts_per_day).OnlyEnforceIf(
                    model.infeasibility_debug_var())


class ShiftsPerGuardPerMonthConstraint(BaseConstraint):
    """
    A constraint for limiting the number of shifts for each guard in a month
    """
    name: Literal["ShiftsPerGuardPerMonthConstraint"] = "ShiftsPerGuardPerMonthConstraint"
    min_shifts_per_month: int
    max_shifts_per_month: int
    shifts_query: Union[ShiftQuery, UnionQuery] = ShiftQuery()

    def __calc_sum(self, model: GuardsAssignmentsModel, guard: BaseGuard, shifts: Iterable[Shift]) -> int:
        """
        Calculates the sum of given shifts for a given guard over a month
        :param model:   the assignments model
        :param guard:   the guard to calculate the number of shifts for
        :param shifts:  pool of shifts
        :return:        the sum of shifts for the given guard over a month
        """
        return sum(model.assignment_vars[(shift, guard)] for shift in shifts)

    def validate_parameters(self):
        if self.min_shifts_per_month < 0:
            raise ValueError(f"Invalid argument: min_shifts_per_month ({self.min_shifts_per_month}) is < 0")
        if self.max_shifts_per_month < 0:
            raise ValueError(f"Invalid argument: max_shifts_per_month ({self.max_shifts_per_month}) is < 0")
        if self.max_shifts_per_month < self.min_shifts_per_month:
            raise ValueError(f"Invalid arguments: max_shifts_per_mount ({self.max_shifts_per_month}) is less than "
                             f"min_shifts_per_month ({self.min_shifts_per_month})")

    def apply_constraint(self, model: GuardsAssignmentsModel):
        shifts = self.shifts_query.evaluate(model.shifts)

        for guard in model.guards:
            calculated_sum = self.__calc_sum(model, guard, shifts)
            model.model.Add(calculated_sum <= self.max_shifts_per_month).OnlyEnforceIf(model.infeasibility_debug_var())
            model.model.Add(calculated_sum >= self.min_shifts_per_month).OnlyEnforceIf(model.infeasibility_debug_var())


class SpecificDayPerGuardPerMonthConstraint(BaseConstraint):
    """
    A constraint for limiting the number of recurrences of a specific day
    """
    name: Literal["SpecificDayPerGuardPerMonthConstraint"] = "SpecificDayPerGuardPerMonthConstraint"
    min_days_per_month: int
    max_days_per_month: int
    day: Weekday

    def __calc_sum(self, model: GuardsAssignmentsModel, guard: BaseGuard) -> int:
        """
        Calculates the sum of shifts that occur in a specific day for a given guard over a month
        :param model:   the assignments model
        :param guard:   the guard to calculate the number of shifts for
        :return:        the sum of shifts that occur in a specific day for the given guard over a month
        """
        return sum(model.assignment_vars[(shift, guard)] for shift in model.shifts if shift.date.weekday() == self.day)

    def validate_parameters(self):
        if self.min_days_per_month < 0:
            raise ValueError(f"Invalid argument: min_days_per_month ({self.min_days_per_month}) is < 0")
        if self.max_days_per_month < 0:
            raise ValueError(f"Invalid argument: max_days_per_month ({self.max_days_per_month}) is < 0")
        if self.max_days_per_month < self.min_days_per_month:
            raise ValueError(f"invalid arguments: max_days_per_month ({self.max_days_per_month}) is less "
                             f"than min_days_per_month ({self.min_days_per_month}")

    def apply_constraint(self, model: GuardsAssignmentsModel):
        for guard in model.guards:
            calculated_sum = self.__calc_sum(model, guard)
            model.model.Add(calculated_sum <= self.max_days_per_month).OnlyEnforceIf(model.infeasibility_debug_var())
            model.model.Add(calculated_sum >= self.min_days_per_month).OnlyEnforceIf(model.infeasibility_debug_var())


class SpecificDayPerGuardPerMonthWithHistoryConstraint(SpecificDayPerGuardPerMonthConstraint):
    """
    A constraint for limiting the number of recurrences of a specific day with consideration of history in a given time
    """
    name: Literal["SpecificDayPerGuardPerMonthWithHistoryConstraint"] = "SpecificDayPerGuardPerMonthWithHistoryConstraint"
    history_days: int

    def validate_parameters(self):
        super().validate_parameters()
        if self.history_days < 0:
            raise ValueError(f"Invalid argument: history_days ({self.history_days}) is < 0")

    def __calc_sum(self, model: GuardsAssignmentsModel, guard: BaseGuard) -> int:
        return super().__calc_sum(model, guard) + \
               sum(shift.date.weekday() == self.day for shift in guard.previous_shifts)


class NoSpecificDayAfterSpecificDayConstraint(BaseConstraint):
    """
    A constraint for limiting the occurrence of two subsequent specific days in a given interval
    """
    name: Literal["NoSpecificDayAfterSpecificDayConstraint"] = "NoSpecificDayAfterSpecificDayConstraint"
    first_day: Weekday
    second_day: Weekday
    day_interval: int

    def __calc_sum(self, model: GuardsAssignmentsModel, guard: BaseGuard,
                   first_day_and_second_day_shifts: Iterable[Shift]) -> int:
        """
        Calculates the sum of shifts in two subsequent specific days for a given guard over a month
        :param model:                           the assignments model
        :param guard:                           the guard to calculate the number of shifts for
        :param first_day_and_second_day_shifts: the shifts in the 1st group the are before shift in the 2nd group
        :return:                                the sum of shifts in two subsequent specific days for the given guard
                                                over a month
        """
        return sum(model.assignment_vars[shift, guard] for shift in first_day_and_second_day_shifts)

    def validate_parameters(self):
        if self.day_interval < 0:
            raise ValueError(f"Invalid argument: day_interval ({self.day_interval}) is < 0")

    def apply_constraint(self, model: GuardsAssignmentsModel):
        first_day_shifts = model.shifts.find(weekdays=(self.first_day,))
        first_day_shift_dates = set(shift.date for shift in first_day_shifts)

        for first_day_shift_date in first_day_shift_dates:
            first_day_and_second_day_shifts = model.shifts.find(
                start_date=first_day_shift_date,
                end_date=first_day_shift_date + timedelta(days=self.day_interval),
                weekdays=(self.second_day,)
            )
            for guard in model.guards:
                model.model.Add(self.__calc_sum(model, guard, first_day_and_second_day_shifts) <= 1)


class NoSpecificShiftsAfterSpecificShiftsConstraint(BaseConstraint):
    """
    A constraint for limiting the occurrence of two subsequent events in a given interval
    """
    name: Literal["NoSpecificShiftsAfterSpecificShiftsConstraint"] = "NoSpecificShiftsAfterSpecificShiftsConstraint"
    first_shifts_query: Union[ShiftQuery, UnionQuery]
    second_shifts_query: Union[ShiftQuery, UnionQuery]
    day_interval: int

    def __calc_sum(self, model: GuardsAssignmentsModel, guard: BaseGuard,
                   first_event_shifts: List[Shift],
                   second_event_shifts: List[Shift]):
        """
        Calculates the sum of shifts in two guarding group for a given guard over a month
        :param model:                           the assignments model
        :param guard:                           the guard to calculate the number of shifts for
        :param first_event_shifts:     the shifts in the 1st group the are before shift in the 2nd group
        :param second_event_shifts:    the shifts in the 2st group the are after shift in the 1nd group
        :return:                                the sum of shifts of a specific guarding group for the given guard over
                                                a month
        """
        return sum(model.assignment_vars[shift, guard] for shift in
                   first_event_shifts + second_event_shifts)

    def validate_parameters(self):
        if self.day_interval < 0:
            raise ValueError(f"Invalid argument: day_interval ({self.day_interval}) is < 0")

    def apply_constraint(self, model: GuardsAssignmentsModel):
        first_event_shifts = self.first_shifts_query.evaluate(model.shifts)
        first_event_shifts_dates = set(shift.date for shift in first_event_shifts)

        for first_event_shift_date in first_event_shifts_dates:
            second_event_after_first_event_shifts = self.second_shifts_query.evaluate(model.shifts).find(
                date=first_event_shift_date + timedelta(days=self.day_interval)
            ).to_list()

            if second_event_after_first_event_shifts:
                first_event_before_second_event_shifts = self.first_shifts_query.evaluate(
                    model.shifts.find(date=first_event_shift_date)
                ).to_list()

                if first_event_before_second_event_shifts:
                    for guard in model.guards:
                        model.model.Add(self.__calc_sum(model, guard, first_event_before_second_event_shifts,
                                                        second_event_after_first_event_shifts) <= 1)


class SpecificShiftsInServiceConstraint(BaseConstraint):
    """
    A constraint that limits the number of shift of a specific guarding group in a whole service
    """
    name: Literal["SpecificShiftsInServiceConstraint"] = "SpecificShiftsInServiceConstraint"

    max_shifts_in_service: int
    shifts_query: Union[ShiftQuery, UnionQuery]

    def validate_parameters(self):
        if self.max_shifts_in_service < 0:
            raise ValueError(f"Invalid argument: max_shifts_in_service ({self.max_shifts_in_service}) is < 0")

    def apply_constraint(self, model: GuardsAssignmentsModel):
        current_specific_shifts = self.shifts_query.evaluate(model.shifts)

        for guard in model.guards:
            # Number of old shifts that answer criteria
            number_of_old_specific_shifts = len(self.shifts_query.evaluate(guard.previous_shifts))

            # For every shift in current period, make sure it won't exceed the maximum of shifts
            # of that kind that are allowed during service
            if number_of_old_specific_shifts >= self.max_shifts_in_service:
                for shift in current_specific_shifts:
                    model.model.Add(model.assignment_vars[shift, guard] == 0) \
                        .OnlyEnforceIf(model.infeasibility_debug_var())


class LimitRealOfficerGuardingGroupPerMonthConstraint(BaseConstraint):
    """
    A constraint that limits the number of shift of a specific guarding group per month for real officers
    """
    name: Literal["LimitRealOfficerGuardingGroupPerMonthConstraint"] = "LimitRealOfficerGuardingGroupPerMonthConstraint"

    min_shift_per_month: int
    max_shift_per_month: int
    shifts_query: Union[ShiftQuery, UnionQuery]

    def validate_parameters(self):
        if self.min_shift_per_month < 0:
            raise ValueError(f"Invalid argument: min_shift_per_month ({self.min_shift_per_month}) is < 0")
        if self.max_shift_per_month < 0:
            raise ValueError(f"Invalid argument: max_shift_per_month ({self.max_shift_per_month}) is < 0")
        if self.max_shift_per_month < self.min_shift_per_month:
            raise ValueError(f"Invalid arguments: max_shifts_in_service ({self.max_shift_per_month}) is less "
                             f"than min_shift_per_month ({self.min_shift_per_month})")

    def __calc_sum(self, model: Union[UnifiedScoreRegularModel, UnifiedScoreWeekendsModel], guard: OfficerGuard) -> int:
        """
        Calculates the sum of shifts in a guarding group for real officers
        :param model:                           the assignments model
        :param guard:                           the guard to calculate the number of shifts for
        """
        return sum(model.assignment_vars[shift, guard] for shift in self.shifts_query.evaluate(model.shifts))

    def apply_constraint(self, model: Union[UnifiedScoreRegularModel, UnifiedScoreWeekendsModel]):
        for guard in model.guards.find(has_done_bhd1=True):
            model.model.Add(self.__calc_sum(model, guard) >= self.min_shift_per_month)
            model.model.Add(self.__calc_sum(model, guard) <= self.max_shift_per_month)


class LimitOnlyOneHolidayInService(BaseConstraint):
    """
    A constraint that disallows assigning a guard that has done a holiday
    shift in the past
    """
    name: Literal["LimitOnlyOneHolidayInService"] = "LimitOnlyOneHolidayInService"

    def validate_parameters(self):
        pass

    def __calc_sum(self, model: Union[UnifiedScoreRegularModel, UnifiedScoreWeekendsModel], guard: BaseGuard) -> int:
        """
        Calculates the sum of shifts in a guarding group for real officers
        :param model:                           the assignments model
        :param guard:                           the guard to calculate the number of shifts for
        """
        return sum(model.assignment_vars[shift, guard] for shift in model.shifts.find(is_holiday=True))

    def apply_constraint(self, model: Union[UnifiedScoreRegularModel, UnifiedScoreWeekendsModel]):
        for guard in model.guards.find(has_done_holiday=True):
            model.model.Add(self.__calc_sum(model, guard) == 0)
