from pydantic import BaseSettings


class Settings(BaseSettings):
    microsoft_login_redirect_uri: str = ""
    environment: str = "development"


settings = Settings()
