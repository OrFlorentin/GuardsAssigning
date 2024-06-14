from datetime import timedelta, datetime
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from fastapi_permissions import Everyone, Authenticated, configure_permissions, Allow
from jose import jwt, JWTError
from starlette import status

from models.user import UserModel

SECRET_KEY = "SUPERSECRET"  # TODO: replace with environment variable
HASH_ALGORITHM = "HS256"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create access token for user
    :param data: data for token creation
    :param expires_delta: delta till token's expires
    :return: encoded token (jwt)
    """
    data_to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    data_to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(data_to_encode, SECRET_KEY, algorithm=HASH_ALGORITHM)

    return encoded_jwt


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

authorization_exception = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Insufficient permissions"
)


async def get_active_user(token: str = Depends(oauth2_scheme)) -> UserModel:
    """
    Get active user from DB by token info of an authenticated user (username)
    :param token: an OAuth2 token
    :return: user from DB
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[HASH_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await UserModel.find_one(UserModel.username == username)
    if user is None:
        raise credentials_exception
    return user


def get_active_principals(user: UserModel = Depends(get_active_user)):
    """
    Dependency that retrieves security principals of active user
    :param user:
    :return:
    """
    if user:
        # user is logged in
        principals = [Everyone, Authenticated]
        principals.extend(getattr(user, "principals", []))
    else:
        # user is not logged in
        principals = [Everyone]
    return principals


Permission = configure_permissions(active_principals_func=get_active_principals,
                                   permission_exception=authorization_exception)
