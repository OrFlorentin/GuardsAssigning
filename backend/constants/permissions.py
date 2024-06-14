from enum import Enum

ROLE = 'role'
ROLE_DELIMITER = ':'

class Role(str, Enum):
    Manager = "manager"
    Admin = "admin"

class Action(str, Enum):
    View = "view"
    Edit = "edit"
    Create = "create"
    CreateOrEdit = "create_or_edit"
    Delete = "delete"
    Assign = "assign"
    ChangeScore = "change_score"
    ChangeRestrictions = "change_restrictions"
