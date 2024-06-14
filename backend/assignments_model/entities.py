import abc
import datetime
from typing import List, Optional, Tuple, Iterable

import numpy as np
import pandas as pd
import tabulate
from beanie import PydanticObjectId

from assignments_model.utils.date_utils import iter_dates, parse_date_restrictions
from models.shift_type import ShiftTypeModel
from models.score import DayTypeEnum, ScoreDeltaModel, ScoreModel


class Shift:
    def __init__(self,
                 date: datetime.date,
                 shift_type: ShiftTypeModel,
                 is_holiday: bool = False,
                 num_days: int = 0,
                 score: Optional[ScoreDeltaModel] = None,
                 id_: Optional[PydanticObjectId] = None):
        self.date = date
        self.day_type = DayTypeEnum.from_date(date)
        self.shift_type = shift_type
        self.is_holiday = is_holiday
        self.num_days = num_days
        self.score = score
        self.id_ = id_

    def before(self, other: 'Shift') -> bool:
        """
        Check if current shift takes place on an earlier date than other shift
        :param other: other shift
        :return: True if current shift takes place on an earlier date than other shift, false otherwise
        """
        return self.date < other.date

    def formatted_date(self) -> str:
        """
        Format shift date as DAY/MONTH/YEAR
        :return: formatted shift date
        """
        return self.date.strftime('%d/%m/%Y')

    def is_weekend(self) -> bool:
        """
        Checks if current shift takes place on a weekend
        :return: True if current shift takes place on a weekend, False otherwise
        """
        return self.day_type == DayTypeEnum.WEEKEND

    def base_score(self) -> ScoreDeltaModel:
        """
        Returns default score for current shift
        :return: default score for current shift
        """
        score = self.shift_type.get_default_score(self.day_type)
        return score

    def __repr__(self):
        return f"Shift(date={self.date.strftime('%d/%m/%Y')}, type={self.shift_type.name})"

    def __hash__(self):
        return hash((self.date, self.shift_type.name))


class BaseCollection(abc.ABC):
    """
    An abstract base class for a collection of searchable objects
    """
    @abc.abstractmethod
    def find(self, **kwargs) -> 'BaseCollection':
        raise NotImplementedError

    @abc.abstractmethod
    def to_list(self) -> List:
        raise NotImplementedError

    @abc.abstractmethod
    def __iter__(self):
        raise NotImplementedError

    @abc.abstractmethod
    def __len__(self):
        raise NotImplementedError


class ShiftCollection(BaseCollection):
    """
    Collection of Shift objects
    """

    def __init__(self, shifts: Optional[Iterable[Shift]] = None):
        if shifts is None:
            self.shifts = []
        else:
            self.shifts: List[Shift] = list(shifts)

    @classmethod
    def from_df(cls, shifts_table: pd.DataFrame):
        shifts = []
        for row in shifts_table.itertuples():
            shifts.append(
                Shift(date=row.date,
                      shift_type=DayTypeEnum(row.shift_type), # wot
                      is_holiday=bool(row.is_holiday),
                      num_days=row.num_days)
            )
        return cls(shifts=shifts)

    def all_dates(self):
        """
        Return set of all relevant dates to given shifts
        :return: set of all relevant dates to given shifts
        """
        return set(shift.date for shift in self.shifts)

    def find(self,
             *,
             date: Optional[datetime.date] = None,
             start_date: Optional[datetime.date] = None,
             end_date: Optional[datetime.date] = None,
             shift_types: Optional[Tuple[str, ...]] = None,
             day_types: Optional[Tuple[DayTypeEnum]] = None,
             weekdays: Optional[Tuple[int]] = None,
             is_holiday: Optional[bool] = None) -> 'ShiftCollection':
        """
        Filter shifts based on parameters
        :param date: filter shifts based on a single date
        :param start_date: starting date for search
        :param end_date: ending date for search
        :param shift_types: types of shifts to search for
        :param day_types: types of days to search for (weekend, weekday, holiday)
        :param weekdays: tuple of weekdays to search for
        :param is_holiday: does the shift take place in a holiday
        :return: list of shifts that fit all criteria
        """

        if not self.shifts:
            return ShiftCollection()
        if date is not None and start_date is None and end_date is None:
            start_date = date
            end_date = date
        elif start_date is None:
            start_date = min(self.all_dates())
        if end_date is None:
            end_date = max(self.all_dates())

        found_shifts = [shift for shift in self.shifts
                        if shift.date in iter_dates(start_date=start_date, end_date=end_date)]

        if shift_types is not None:
            found_shifts = [shift for shift in found_shifts if shift.shift_type.name in shift_types]

        if day_types is not None:
            found_shifts = [shift for shift in found_shifts if shift.day_type in day_types]

        if weekdays is not None:
            found_shifts = [shift for shift in found_shifts if shift.date.weekday() in weekdays]

        if is_holiday is not None:
            found_shifts = [shift for shift in found_shifts if shift.is_holiday == is_holiday]

        return ShiftCollection(found_shifts)

    def append(self, shift: Shift):
        self.shifts.append(shift)

    def to_list(self):
        return self.shifts

    def __getitem__(self, key):
        return self.shifts[key]

    def __iter__(self):
        return iter(self.shifts)

    def __add__(self, other: 'ShiftCollection'):
        return ShiftCollection(set(self.shifts + other.shifts))

    def __len__(self):
        return len(self.shifts)


class BaseGuard(abc.ABC):
    def __init__(self,
                 name: str,
                 restrictions: Optional[List[datetime.date]] = None,
                 previous_shifts: Optional[ShiftCollection] = None,
                 id_: Optional[PydanticObjectId] = None):
        self.name = name
        self.restrictions = restrictions
        self.previous_shifts = previous_shifts
        self.previous_regular_score = None
        self.id_ = id_

        if self.restrictions is None:
            self.restrictions = []

        if self.previous_shifts is None:
            self.previous_shifts = ShiftCollection()

        self.previous_shifts.shifts.sort(key=lambda shift: shift.date)

    def last_weekend(self) -> Optional[Shift]:
        """
        Get last weekend shift of the current guard
        :return: guard's last weekend shift
        """
        for shift in reversed(self.previous_shifts):
            if shift.is_weekend():
                return shift
        return None

    def add_request(self, date: datetime.date):
        """
        Add request that guard won't have shifts on a given date
        :param date: date when guard won't have shifts
        """
        self.restrictions.append(date)

    def add_requests(self, dates: List[datetime.date]):
        """
        Add request that guard won't have shifts on given dates
        :param dates: dates when guard won't have shifts
        """
        for date in dates:
            self.add_request(date=date)

    @abc.abstractmethod
    def apply_shift(self, shift: Shift):
        raise NotImplementedError

    def __repr__(self):
        return f"Guard(name={self.name})"

    def __hash__(self):
        return hash((self.name,))


class BaseGuardCollection(BaseCollection):
    """
    Collection of Guard objects
    """

    def __init__(self, guards: Optional[Iterable[BaseGuard]] = None):
        if guards is None:
            self.guards = []
        else:
            self.guards = list(guards)

    def add_restrictions_from_df(self, restrictions_table: pd.DataFrame):
        for row in restrictions_table.itertuples():
            guards = self.find(names=[row.name])

            if len(guards) > 1:
                raise ValueError(f"Guard with name '{row.name}' has more than one Guard object")
            if guards:
                guard = guards[0]
                guard_restrictions = parse_date_restrictions(row.restrictions)
                guard.add_requests(guard_restrictions)
            else:
                print(f"Couldn't find guard with name '{row.name}'")

    @abc.abstractmethod
    def find(self, *, names: Optional[List[str]] = None, **kwargs):
        raise NotImplementedError

    def to_list(self):
        return self.guards

    def __getitem__(self, key):
        return self.guards[key]

    def __iter__(self):
        return iter(self.guards)

    def __add__(self, other: 'BaseGuardCollection'):
        return BaseGuardCollection(set(self.guards + other.guards))

    def __len__(self):
        return len(self.guards)

    def __bool__(self):
        return bool(self.__len__())


class UnifiedScoreGuard(BaseGuard):
    def __init__(self,
                 name: str,
                 time_in_duty: int,
                 score_multiplier: int,
                 score: ScoreModel,
                 num_holidays: int,
                 restrictions: Optional[List[datetime.date]] = None,
                 previous_shifts: Optional[List[Shift]] = None,
                 id_: Optional[PydanticObjectId] = None
                 ):
        self.time_in_duty = time_in_duty
        self.score_multiplier = score_multiplier
        self.score = score
        self.num_holidays = num_holidays
        self.previous_regular_score = None

        super().__init__(name=name, restrictions=restrictions, previous_shifts=previous_shifts, id_=id_)

    def calculate_score_for_shift(self, shift: Shift) -> ScoreDeltaModel:
        """
        Calculate the score that guard will earn for a given shift
        :return: score
        """
        base_score = shift.base_score()
        if shift.is_holiday:
            # TODO: update this according to real holidays calculations!!!
            # Add holiday score
            weekend_score = self.score_multiplier * 0.5 * shift.num_days \
                            * shift.shift_type.get_default_score(DayTypeEnum.WEEKEND).weekend_score
            return ScoreDeltaModel(weekend_score=weekend_score)
        return base_score * self.score_multiplier

    def weighted_regular_score(self):
        return self.score.regular_score / self.time_in_duty

    def weighted_weekend_score(self):
        return self.score.weekend_score / self.time_in_duty

    def apply_shift(self, shift: Shift):
        """
        Apply shift assigned to guard and update relevant scores
        :param shift: shift to be applied to guard
        """
        self.score += self.calculate_score_for_shift(shift)
        self.previous_shifts.append(shift)

    def __repr__(self):
        return f"Guard(name={self.name}, score={self.score}, pazam_level={self.score_multiplier})"

    def __hash__(self):
        return hash((self.name,))


class OfficerGuard(UnifiedScoreGuard):
    def __init__(self, has_done_bhd1: bool, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.has_done_bhd1 = has_done_bhd1


class HogerGuard(UnifiedScoreGuard):
    pass


class UnifiedScoreGuardCollection(BaseGuardCollection):
    """
    Collection of Guard objects
    """

    def __init__(self, guards: Optional[Iterable[UnifiedScoreGuard]] = None):
        self.guards = []
        if guards is not None:
            self.guards: List[UnifiedScoreGuard] = list(guards)
        super().__init__(guards=guards)

    def find(self,
             *,
             names: Optional[List[str]] = None,
             has_done_holiday: Optional[bool] = None,
             **kwargs) -> 'UnifiedScoreGuardCollection':
        """
        Find Guard objects based on parameters
        :param names: names of guards
        :param has_done_holiday: whether guards have done holiday
        :return: list of found UnifiedScoreGuard objects
        """
        guards: List[UnifiedScoreGuard] = list(self.guards)

        if names is not None:
            guards = [guard for guard in guards if guard.name in names]

        if has_done_holiday is not None:
            guards = [guard for guard in guards if has_done_holiday == (guard.num_holidays > 0)]

        return UnifiedScoreGuardCollection(guards)

    def print_table(self):
        headers = ["Name", "Weighted Score", "Weighted Weekend Score", "Months on Duty", "Pazam Level", "Regular Score",
                   "Weekend Score", "Update"]
        formatted_list = [
            [guard.name, f'{guard.weighted_regular_score():.3f}', f'{guard.weighted_weekend_score():.3f}',
             guard.time_in_duty, guard.pazam_level, guard.regular_score, guard.weekend_score,
             ("+" + str(guard.regular_score - guard.previous_regular_score)) if guard.previous_regular_score else ""]
            for guard in sorted(self.guards, key=lambda g: g.weighted_regular_score(), reverse=True)
        ]
        print(tabulate.tabulate(formatted_list, headers=headers))
        print(f"Variance: {np.std([guard.weighted_regular_score() for guard in self.guards]):.3f}")
        print()

    def __add__(self, other: 'UnifiedScoreGuardCollection'):
        return UnifiedScoreGuardCollection(set(self.guards + other.guards))


class OfficerGuardCollection(UnifiedScoreGuardCollection):
    def __init__(self, guards: Optional[Iterable[OfficerGuard]] = None):
        self.guards = []
        if guards is not None:
            self.guards: List[OfficerGuard] = list(guards)
        super().__init__(guards=self.guards)

    def find(self,
             *,
             names: Optional[List[str]] = None,
             has_done_bhd1: Optional[bool] = None,
             **kwargs
             ) -> 'OfficerGuardCollection':
        """
        Find Guard objects based on parameters
        :param names: names of guards
        :param has_done_bhd1: did the officer go to bhd1
        :return: list of found Guard objects
        """
        guards: List[OfficerGuard] = list(super().find(names=names))

        if has_done_bhd1 is not None:
            guards = [guard for guard in guards if guard.has_done_bhd1 == has_done_bhd1]

        return OfficerGuardCollection(guards)


class HogerGuardCollection(UnifiedScoreGuardCollection):
    pass


class Assignment:
    """
    Represents assignment of a guard to a shift
    """

    def __init__(self, shift: Shift, guard: BaseGuard):
        self.shift = shift
        self.guard = guard

    def __hash__(self):
        return hash((self.shift, self.guard))

    def __repr__(self):
        return f"Assignment(name={self.guard.name}, " \
               f"date={self.shift.formatted_date()}, " \
               f"type={self.shift.shift_type.name})"

    def to_dict(self):
        return {
            'guard_name': self.guard.name,
            'date': self.shift.formatted_date(),
            'type': self.shift.shift_type.name,
            'is_holiday': self.shift.is_holiday,
            'holiday_num_days': self.shift.num_days
        }


class AssignmentCollection:
    """
    Collection of Assignment objects
    """

    def __init__(self, assignments: Optional[List[Assignment]] = None):
        if assignments is None:
            self.assignments = []
        else:
            self.assignments: List[Assignment] = list(assignments)

    def to_df(self):
        df = pd.DataFrame([assignment.to_dict() for assignment in self.assignments])
        return df

    def to_list(self):
        return self.assignments

    def print_table(self):
        headers = ["Date", "Guard", "Type", "Holiday", "Added score"]
        formatted_list = [
            [assignment.shift.date.strftime('%d/%m/%Y'),
             assignment.guard.name,
             assignment.shift.shift_type.name,
             "YES" if assignment.shift.is_holiday else "",
             f"+" + str(assignment.guard.calculate_regular_score_for_shift(assignment.shift))]
            for assignment in self.assignments  # if assignment.shift.is_weekend()
        ]
        print(tabulate.tabulate(formatted_list, headers=headers))
        print()

    def __getitem__(self, key):
        return self.assignments[key]

    def __iter__(self):
        return iter(self.assignments)
