from datetime import timedelta

import msal
from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse, RedirectResponse
from pydantic.main import BaseModel

from config import settings
from models.user import UserModel
from utils.authorization_utils import create_access_token


class Token(BaseModel):
    access_token: str
    token_type: str


CLIENT_ID = "33e0c86f-af5d-4969-8127-866bef397f55"
CLIENT_SECRET = "i6S8Q~zHg9jlshjq2Rpw1CT5VW.vTBwjJWWwCcV9"
AUTHORITY = "https://login.microsoftonline.com/organizations"
REDIRECT_URL = settings.microsoft_login_redirect_uri
JWT_SECRET = "SECRET"
SCOPES = ["User.ReadBasic.All"]

ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter(prefix="/auth", tags=["Authentication"])
confidential_client_app = msal.ConfidentialClientApplication(
    CLIENT_ID,
    authority=AUTHORITY,
    client_credential=CLIENT_SECRET
)


@router.post("/login", response_class=PlainTextResponse)
async def redirect_login_to_microsoft():
    # saved under router so we'll have access to it from all function (stupid, i know.. it's the only way i found)
    msal_flow_uri = _build_auth_code_flow(scopes=SCOPES)
    return msal_flow_uri  # returns the right url to redirect to login via microsoft


def _build_auth_code_flow(authority=None, scopes=None):
    return confidential_client_app.get_authorization_request_url(
        scopes or [],
        redirect_uri=REDIRECT_URL
    )


@router.get("/get_token")
async def get_token(req: Request):
    """
    Parses and decrypt params from microsoft ad so we'll be able to access the account
    :param req:
    :return:
    """
    micParams = dict(req.query_params)  # Parses the params given from the url and casts them to dictionary
    # Sends the params to msal that decrypts the data and returns a token
    micUserRes = confidential_client_app.acquire_token_by_authorization_code(micParams['code'],
                                                                             SCOPES,
                                                                             redirect_uri=REDIRECT_URL)
    if "error" in micUserRes:
        return RedirectResponse(f"/login?error=true")

    username = micUserRes["id_token_claims"]["preferred_username"]
    user = await UserModel.find_one(UserModel.username == username)

    if user:
        access_token_expires_time = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": username}, expires_delta=access_token_expires_time
        )
        res = RedirectResponse(f"/login?token={access_token}")
    else:
        # TODO: add a real error here
        res = RedirectResponse(f"/login?error=true")
    return res
