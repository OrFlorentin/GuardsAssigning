from enum import Enum
from typing import List

from pydantic.main import BaseModel


class ScoreParamsType(str, Enum):
    HOGER_PARAMS = "HogerGuardParams"
    OFFICER_PARAMS = "OfficerGuardParams"


class GuardScoreParamsModel(BaseModel):
    type: ScoreParamsType


class ColumnType(str, Enum):
    """
    Type of column in score table. Columns can be numbers, boolean or strings.
    """
    NUMBER = "number"
    BOOLEAN = "boolean"
    STRING = "string"


class TableColumnProperties(BaseModel):
    """
    Properties of a single column in a score table.
    """
    column_id: str
    display_name: str
    type: ColumnType
    editable: bool = True


class TableSchema(BaseModel):
    """
    Score table schema. Consists of a list of properties for each column.
    """
    __root__: List[TableColumnProperties]


def create_frontend_table_schema(columns_list):
    """
    Creates table schema out of a list of table columns.
    :param columns_list List of table columns properties.
    :return: Table schema.
    """
    return TableSchema(__root__=columns_list)


score_type_to_table_schema = {
    ScoreParamsType.HOGER_PARAMS: create_frontend_table_schema([
        TableColumnProperties(column_id="regular_score", display_name="ניקוד רגיל", type=ColumnType.NUMBER, editable=False),
        TableColumnProperties(column_id="weekend_score", display_name="ניקוד סופש", type=ColumnType.NUMBER, editable=False),
        TableColumnProperties(column_id="num_holidays", display_name="מספר חגים", type=ColumnType.NUMBER),
    ]),
    ScoreParamsType.OFFICER_PARAMS: create_frontend_table_schema([
        TableColumnProperties(column_id="regular_score", display_name="ניקוד רגיל", type=ColumnType.NUMBER, editable=False),
        TableColumnProperties(column_id="weekend_score", display_name="ניקוד סופש", type=ColumnType.NUMBER, editable=False),
        TableColumnProperties(column_id="num_holidays", display_name="מספר חגים", type=ColumnType.NUMBER),
        TableColumnProperties(column_id="has_done_bhd1", display_name="האם עשה בהד 1", type=ColumnType.BOOLEAN),
    ])
}
