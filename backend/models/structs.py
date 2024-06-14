import datetime
from enum import Enum

from beanie import PydanticObjectId
from pydantic.datetime_parse import parse_date, parse_datetime


# Make sure there isn't an '&' or '=' in the names, so the roles don't get messed up
class PopulationType(str, Enum):
    HOGER = "איכר"
    OFFICER = "אביר"


class Location(str, Enum):
    LOTEM = "Lotem"
    YADIN = "Yadin"
    BAREKET = "Bareket"


class Date(datetime.datetime):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate_date

    def validate_date(cls, v):
        if isinstance(v, datetime.datetime):
            date = v.date()
        else:
            try:
                date = parse_date(v)
            except:
                date = parse_datetime(v).date()
        return datetime.datetime.combine(date=date, time=datetime.time.min)

    def date(self):
        return datetime.date(year=self.year, month=self.month, day=self.day)


class ShiftTypeNameEnum(str, Enum):
    """
    Name of shift's type
    """
    ZUTAR_OFFICER = "ZUTAR_OFFICER"
    SENIOR_OFFICER = "SENIOR_OFFICER"
    LOTEM_HOGER = "LOTEM_HOGER_REGULAR"
    LOTEM_HOGER_KAFKAF = "LOTEM_HOGER_KAFKAF"
    YADIN_HOGER = "YADIN_HOGER_REGULAR"
    YADIN_OFFICER = "YADIN_OFFICER"


UserKey = PydanticObjectId
