import datetime
from functools import reduce
from typing import List, Optional, Tuple, Literal, Union

from pydantic.main import BaseModel

from assignments_model.entities import BaseCollection
from models.score import DayTypeEnum

DISCRIMINATOR_FIELD = "name"


class BaseQuery(BaseModel):
    """
    A base class for a query over a single collection that can be answered using a find() function
    """
    def evaluate(self, collection: BaseCollection) -> BaseCollection:
        return collection.find(**{k: v for k, v in self.dict(exclude_unset=True).items() if k != DISCRIMINATOR_FIELD})


class BaseGuardQuery(BaseQuery):
    """
    Base class for query that is performed on a BaseGuardCollection object
    """
    names: Optional[List[str]] = None


class GuardQuery(BaseGuardQuery):
    name: Literal["GuardQuery"] = "GuardQuery"

    """
    Represents a query that is performed on a GuardCollection object
    """
    has_done_holiday: Optional[bool] = None


class OfficerGuardQuery(BaseGuardQuery):
    name: Literal["OfficerGuardQuery"] = "OfficerGuardQuery"

    """
    Represents a query that is performed on an OfficerGuardCollection object
    """
    has_done_bhd1: Optional[bool] = None


class ShiftQuery(BaseQuery):
    name: Literal["ShiftQuery"] = "ShiftQuery"

    """
    Represents a query that is performed on a ShiftCollection object
    """
    date: Optional[datetime.date] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    shift_types: Optional[Tuple[str, ...]] = None
    day_types: Optional[Tuple[DayTypeEnum, ...]] = None
    weekdays: Optional[List[int]] = None
    is_holiday: Optional[bool] = None


class UnionQuery(BaseModel):
    name: Literal["UnionQuery"] = "UnionQuery"
    queries: List[Union[ShiftQuery, OfficerGuardQuery, GuardQuery]]
    """
    Represents union of evaluated query results on multiple collections of the same type
    """

    def evaluate(self, collection: BaseCollection) -> BaseCollection:
        """
        Evaluates unified query results on given collection
        :param collection: given collection to search
        :return: unified, non-repeating collection of query results
        """
        collections = [query.evaluate(collection) for query in self.queries]
        if collections:
            return reduce(lambda a, b: a + b, collections)
