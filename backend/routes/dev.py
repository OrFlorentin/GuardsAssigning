from datetime import timedelta

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic.main import BaseModel
from starlette import status

from models.user import UserModel
from utils.authorization_utils import create_access_token


class Token(BaseModel):
    access_token: str
    token_type: str


ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter(prefix="/dev", tags=["Authentication"])


@router.post("/login")
async def dev_login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    This is a debug endpoint that can be used to login with a username and password
    This shouldn't be available in production!
    :param form_data: username and password
    :return:
    """

    username = form_data.username
    user = await UserModel.find_one(UserModel.username == username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires_time = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires_time
    )
    return {"access_token": access_token, "token_type": "bearer"}
