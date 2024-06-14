import datetime
from enum import Enum
from typing import Union

from pydantic import BaseModel

from constants.constants import FRIDAY_WEEKDAY, SATURDAY_WEEKDAY, THURSDAY_WEEKDAY
from models.structs import Date


class ScoreModel(BaseModel):
    regular_score: float = 0.0
    weekend_score: float = 0.0

    def __add__(self, other: 'ScoreDeltaModel'):
        return ScoreModel(regular_score=self.regular_score + other.regular_score,
                          weekend_score=self.weekend_score + other.weekend_score)


class ScoreDeltaModel(ScoreModel):
    def __add__(self, other: ScoreModel):
        return ScoreDeltaModel(regular_score=self.regular_score + other.regular_score,
                               weekend_score=self.weekend_score + other.weekend_score)

    def __mul__(self, other: int):
        assert type(other) is int, "Can only multiply ScoreDeltaModel by an integer"
        return ScoreDeltaModel(regular_score=self.regular_score * other,
                               weekend_score=self.weekend_score * other)


class DayTypeEnum(str, Enum):
    REGULAR_DAY = "REGULAR_DAY"
    THURSDAY = "THURSDAY"
    WEEKEND = "WEEKEND"

    @classmethod
    def from_date(cls, date: Union[Date, datetime.date]) -> 'DayTypeEnum':
        if date.weekday() in (FRIDAY_WEEKDAY, SATURDAY_WEEKDAY):
            return cls.WEEKEND
        elif date.weekday() == THURSDAY_WEEKDAY:
            return cls.THURSDAY
        return cls.REGULAR_DAY
