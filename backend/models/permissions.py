from typing import Union
from fastapi import HTTPException

from pydantic import BaseModel, root_validator
from models.utils import user_role_to_string
from constants.permissions import Role, ROLE, ROLE_DELIMITER
from models.branch import BranchModel

from models.branch import BranchKey
from models.structs import PopulationType


def parse_parameters(param_str: str):
    '''
    Parses a parameter string and returns a dictionary

    E.g.: key1=value1&key2=value2 -> {'key1': 'value1', 'key2': 'value2'}
    '''
    return {key: value for key, value in (key_value.split('=') for key_value in param_str.split('&'))}

class RoleManagerParameters(BaseModel):
    branch: BranchKey
    population_type: PopulationType

class UserRole(BaseModel):
    role: Role
    extra_parameters: Union[RoleManagerParameters, None]

    @root_validator(pre=True)
    def parse_from_str(cls, values):
        '''
        Attempts to create a UserRole from a role string.

        The role string format is 'role:<role name>:<optional extra parameters>'.
        Role name must be from the Role Enum.
        Some roles require extra parameters that are supplied in a parameter string e.g.:
            'key1=value1&key2=value2'
        '''
        new_values = {}
        role_str = values.get('role_str', None)
        if role_str is not None:
            components = role_str.split(ROLE_DELIMITER)
            assert components[0] == ROLE, f"role_str must start with `{ROLE}`"
            new_values['role'] = components[1]
            if len(components) > 2:
                new_values['extra_parameters'] = parse_parameters(components[2])
            return new_values
        return values
    
    async def verify(self):
        err = 'extra_parameters must be null'
        if self.role == Role.Admin and self.extra_parameters is None:
            return True
        err = 'extra_parameters must be valid'
        if self.role == Role.Manager and isinstance(self.extra_parameters, RoleManagerParameters):
            err = 'extra_parameters.branch must be a valid branch ID'
            branch = await BranchModel.get(self.extra_parameters.branch)
            if branch is not None:
                return True

        raise HTTPException(status_code=422, detail=err)
    
    def to_string(self):
        return user_role_to_string(self.role, self.extra_parameters)
