import os
import sys

from pydantic import BaseModel

BACKEND_FOLDER = os.path.dirname(os.path.dirname((os.path.abspath(__file__))))
sys.path.append(BACKEND_FOLDER)

from constants.permissions import Role
from models.permissions import UserRole
from models.score import ScoreModel

import random
from typing import Optional

import fire
from beanie import init_beanie
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from models.branch import BranchModel, PopulationScoreProperties
from models.score_params import ScoreParamsType
from models.shift import ShiftModel
from models.shift_type import ShiftTypeModel
from models.structs import PopulationType, Date
from models.user import UserModel, HogerGuardExtraParams, OfficerGuardExtraParams, PopulationSettings
import json
import logging

logging.basicConfig(level=logging.INFO, format='[*] %(message)s')
load_dotenv(os.path.join(BACKEND_FOLDER, ".env"))
MODELS = [UserModel, ShiftModel, ShiftTypeModel, BranchModel]


def print_model(model: BaseModel):
    print(json.dumps(json.loads(model.json()), indent=4))


async def create_shift_type(name: str, slots_count: int, population_type: PopulationType):
    """
    Create a shift type in the database
    :param name: name of shift type
    :param slots_count: number of slots for this shift type
    :param population_type: type of population for this shift type
    """
    await init_db_connection()
    shift_type_model = ShiftTypeModel(name=name, slots_count=slots_count, population_type=population_type)
    await shift_type_model.insert()
    print_model(shift_type_model)
    logging.info(f'Shift type "{name}" has been created!')


async def create_branch(name: str, color: Optional[str] = None):
    """
    Create a branch in the database
    :param name: name of branch
    :param color: color of branch (optional)
    """
    await init_db_connection()
    if color is None:
        # Randomize hex color
        color = "#" + "".join([random.choice("0123456789ABCDEF") for _ in range(6)])

    population_score_properties = [
        PopulationScoreProperties(population_type=PopulationType.HOGER,
                                  score_type=ScoreParamsType.HOGER_PARAMS),
        PopulationScoreProperties(population_type=PopulationType.OFFICER,
                                  score_type=ScoreParamsType.OFFICER_PARAMS)
    ]

    branch_model = BranchModel(name=name,
                               color=color,
                               population_score_properties=population_score_properties)
    await branch_model.insert()
    print_model(branch_model)
    logging.info(f'Branch "{name}" has been created!')


async def create_admin_user(name: str, username: str, branch: str, population_type: PopulationType):
    """
    Create admin user for website
    :param name: display name of admin user
    :param username: username of admin user
    :param branch: branch of admin user (must exist)
    :param population_type: population type (Hoger/Officer) of admin user
    """
    await init_db_connection()

    extra_params = None
    if population_type == PopulationType.HOGER:
        extra_params = HogerGuardExtraParams(num_holidays=0)
    elif population_type == PopulationType.OFFICER:
        extra_params = OfficerGuardExtraParams(num_holidays=1,
                                               has_done_bhd1=False)

    branch_model = await BranchModel.find_one(BranchModel.name == branch)
    if branch_model is None:
        raise ValueError(f"Branch '{branch}' is not found")

    user_instance = UserModel(name=name,
                              branch=branch_model.id,
                              username=username,
                              roles=[UserRole(role=Role.Admin).to_string()],
                              population_types=[population_type],
                              population_settings=[
                                  PopulationSettings(population_type=population_type,
                                                     restrictions=[],
                                                     score=ScoreModel(),
                                                     initial_score=ScoreModel(
                                                         regular_score=0.,
                                                         weekend_score=0.
                                                     ),
                                                     extra_params=extra_params,
                                                     score_multiplier=1,
                                                     join_date=Date.today(),
                                                     )
                              ])
    await user_instance.insert()
    print_model(user_instance)
    logging.info(f'Admin user "{name}" has been created!')


async def reset_shifts():
    """
    Delete all shifts from DB
    """
    await init_db_connection()
    logging.info(f'Deleting "{ShiftModel.__name__}" objects...')
    await ShiftModel.delete_all()
    logging.info(f'ShiftModel DB items were deleted successfully!')


async def reset_db():
    """
    Delete everything from DB
    """
    await init_db_connection()
    for model in MODELS:
        logging.info(f'Deleting "{model.__name__}" objects...')
        await model.delete_all()
    logging.info(f'DB items were deleted successfully!')


async def init_db_connection():
    logging.info('Connecting to DB...')
    client = AsyncIOMotorClient(os.getenv("DB_CONNECTION_STRING"))
    await init_beanie(database=client[os.getenv("DB_NAME")],
                      document_models=MODELS)


def main():
    fire.Fire({
        'create_branch': create_branch,
        'create_shift_type': create_shift_type,
        'create_admin_user': create_admin_user,
        'reset_db': reset_db,
        'reset_shifts': reset_shifts
    })


if __name__ == '__main__':
    main()
