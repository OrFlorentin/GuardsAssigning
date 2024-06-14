import os

import dotenv
import uvicorn
from beanie import init_beanie
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from models.branch import BranchModel
from models.shift import ShiftModel, ShiftTypeModel
from models.user import UserModel
from routes import shifts, users, shift_types, export, branches, auth, auto_assign, data, dev
from config import settings

# Default .env file, can be overriden with --env-file
dotenv.load_dotenv(".env")

app = FastAPI(root_path=os.getenv("ROOT_PATH", "/api"))

# TODO: Restrict CORS requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include relevant routes
app.include_router(shifts.router)
app.include_router(auto_assign.router)
app.include_router(users.router)
app.include_router(branches.router)
app.include_router(shift_types.router)
app.include_router(export.router)
app.include_router(auth.router)
app.include_router(data.router)
if settings.environment == 'development':
    app.include_router(dev.router)


@app.on_event("startup")
async def app_init():
    """Initialize application services"""
    motor_client = AsyncIOMotorClient(os.environ["DB_CONNECTION_STRING"])
    await init_beanie(motor_client[os.environ["DB_NAME"]],
                      document_models=[UserModel, ShiftModel, ShiftTypeModel, BranchModel])


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
