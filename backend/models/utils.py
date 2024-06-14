from constants.permissions import Role, ROLE, ROLE_DELIMITER


def user_role_to_string(role: Role, extra_parameters=None):
    components = [ROLE, role.value]
    if extra_parameters:
        parameters = '&'.join([f'{key}={value}' for key, value in extra_parameters.dict().items()])
        components.append(parameters)
    return ROLE_DELIMITER.join(components)
