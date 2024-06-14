import asyncio
import datetime
import json
import os
import random
from typing import List

from beanie import init_beanie
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from constants.permissions import Role
from models.permissions import RoleManagerParameters, UserRole
from models.score import DayTypeEnum

from constants.constants import SATURDAY_WEEKDAY
from models.branch import BranchModel, PopulationScoreProperties
from models.score import ScoreModel, ScoreDeltaModel
from models.user import HogerGuardExtraParams, UserModel, PopulationSettings, OfficerGuardExtraParams
from models.shift import ShiftModel
from models.shift_type import ShiftTypeModel
from models.structs import PopulationType
from models.score_params import ScoreParamsType
from routes.users import update_all_users_score

load_dotenv('.env')

loop = asyncio.get_event_loop()

client = AsyncIOMotorClient(os.getenv("DB_CONNECTION_STRING"))

colors = ['#f44336', '#29b6f6', '#ffa726', '#66bb6a', '#ab47bc', '#651fff']

shift_types = [
    ('טירה (אביר צעיר)', PopulationType.OFFICER, {
        DayTypeEnum.REGULAR_DAY: 1,
        DayTypeEnum.THURSDAY: 1.5,
        DayTypeEnum.WEEKEND: 3.5
    }),
    ('טירה (אביר בכיר)', PopulationType.OFFICER, {
        DayTypeEnum.REGULAR_DAY: 1,
        DayTypeEnum.THURSDAY: 1.5,
        DayTypeEnum.WEEKEND: 3.5
    }),
    ('מדינה (אביר)', PopulationType.OFFICER, {
        DayTypeEnum.REGULAR_DAY: 3,
        DayTypeEnum.THURSDAY: 3,
        DayTypeEnum.WEEKEND: 5
    }),
    ('ממלכה (איכר)', PopulationType.HOGER, {
        DayTypeEnum.REGULAR_DAY: 2,
        DayTypeEnum.THURSDAY: 3.5,
        DayTypeEnum.WEEKEND: 7
    }),
    ('מדינה (איכר)', PopulationType.HOGER, {
        DayTypeEnum.REGULAR_DAY: 3,
        DayTypeEnum.THURSDAY: 5.5,
        DayTypeEnum.WEEKEND: 10.5
    })
]

users = ['רונלד מקדונלד', 'מוטי טקה', 'אדיר אלעד', 'נפתלי בנט', 'איילת שקד', 'כרמל מעודה',
         "אביב כוכבי", "חיים כץ", "אליה זגורי", "רוני דלומי", "פריסיליה קשתי", "אלון דה לוקו",
         "ארז טל", 'רותם סלע', "מתן טריף", "יקיר ג'רבי", "עדי ביטי", "נועה קירל", "מלך זילברשלג",
         "מרים רוסט", "תמר וילנר", 'יוסי כהן', 'אשר קרביץ', "אסף אשתר", "שלום אסייג", "חנוך דאום", "נחמן אדני"]
branches = ['1', '2']


def create_shift_types():
    shift_type_models = []
    for name, population_type, score_config in shift_types:
        shift_type_model = ShiftTypeModel(name=name,
                                          slots_count=1,
                                          population_type=population_type,
                                          score_config=score_config
                                          )
        shift_type_models.append(shift_type_model)
    return shift_type_models


def create_branches():
    population_score_properties = [
        PopulationScoreProperties(population_type=PopulationType.HOGER,
                                  score_type=ScoreParamsType.HOGER_PARAMS),
        PopulationScoreProperties(population_type=PopulationType.OFFICER,
                                  score_type=ScoreParamsType.OFFICER_PARAMS)
    ]

    branch_models = []
    for branch, color in zip(branches, colors):
        branch_model = BranchModel(name=branch,
                                   color=color,
                                   population_score_properties=population_score_properties)
        branch_models.append(branch_model)

    return branch_models


def create_date_range():
    today = datetime.date.today()
    return [datetime.date(today.year, today.month, day) for day in range(1, 28 + 1)]


async def create_random_shifts(user_models: List[UserModel], shift_type_models: List[ShiftTypeModel],
                               branch_models: List[BranchModel]):
    shifts = []

    for date in create_date_range():
        if date.weekday() == SATURDAY_WEEKDAY:
            continue
        picked_users = []
        for shift_type_model in shift_type_models:
            for order in range(shift_type_model.slots_count):
                branch = random.choice(branch_models)
                is_user_assigned = random.choice([False, True])

                user = None
                if is_user_assigned:
                    user = random.choice([user for user in user_models if user.branch == branch.id and
                                          user not in picked_users and shift_type_model.population_type in
                                          user.population_types])
                    picked_users.append(user)

                shift = ShiftModel(date=str(date),
                                   order=order,
                                   shift_type=shift_type_model.id,
                                   population_type=shift_type_model.population_type,
                                   assigned_user_id=user.id if is_user_assigned else None,
                                   branch=branch.id,
                                   is_holiday=False,
                                   score=ScoreDeltaModel(),
                                   is_custom_score=False
                                   )
                await shift.update_score(await shift.default_score())
                shifts.append(shift)

    return shifts


async def remove_all_instances(schemas):
    for schema in schemas:
        await schema.delete_all()


def create_users(branch_models: List[BranchModel]):
    users_instances = []
    index = 0

    # Divide users list into len(branches) chunks
    chunk_size = len(users) // len(branch_models)
    chunks = [users[i:i + chunk_size] for i in range(0, len(users), chunk_size)]
    for branch, users_chunk in zip(branch_models, chunks):
        for user_name in users_chunk:
            population_type = random.choice([PopulationType.OFFICER, PopulationType.HOGER])
            extra_params = None
            if population_type == PopulationType.HOGER:
                extra_params = HogerGuardExtraParams(num_holidays=0)
            elif population_type == PopulationType.OFFICER:
                extra_params = OfficerGuardExtraParams(num_holidays=1,
                                                       has_done_bhd1=False)

            user_instance = UserModel(name=user_name,
                                      branch=branch.id,
                                      username=f"User{index}",
                                      roles=[],
                                      population_types=[population_type],
                                      population_settings=[
                                          PopulationSettings(population_type=population_type,
                                                             restrictions=[],
                                                             score=ScoreModel(),
                                                             initial_score=ScoreModel(
                                                                 regular_score=random.randint(1, 20),
                                                                 weekend_score=random.randint(0, 5)
                                                             ),
                                                             extra_params=extra_params,
                                                             score_multiplier=1,
                                                             join_date=datetime.date.today(),
                                                             )
                                      ])
            users_instances.append(user_instance)
            index += 1

    users_instances[0].roles.append(UserRole(role=Role.Admin).to_string())

    for user_index in range(1, 5):
        user = users_instances[user_index]

        population_types = [PopulationType.HOGER, PopulationType.OFFICER] if user_index <= 2 \
            else [PopulationType.OFFICER]
        
        for population_type in population_types:
            user.roles.append(UserRole(role=Role.Manager, extra_parameters=RoleManagerParameters(
                branch=user.branch,
                population_type=population_type.value
            )).to_string())

    return users_instances


async def main():
    models = [UserModel, ShiftModel, ShiftTypeModel, BranchModel]
    await init_beanie(database=client[os.getenv("DB_NAME")],
                      document_models=models)
    await remove_all_instances(models)

    shift_type_models = create_shift_types()
    await ShiftTypeModel.insert_many(shift_type_models)
    shift_type_models = await ShiftTypeModel.find_all().to_list()

    branch_models = create_branches()
    await BranchModel.insert_many(branch_models)
    branch_models = await BranchModel.find_all().to_list()

    user_models = create_users(branch_models=branch_models)
    await UserModel.insert_many(user_models)
    user_models = await UserModel.find_all().to_list()
    user_ids = [str(user.id) for user in user_models]

    shift_models = await create_random_shifts(user_models=user_models, shift_type_models=shift_type_models,
                                              branch_models=branch_models)
    await ShiftModel.replace_many(shift_models)
    shift_models = await ShiftModel.find_all().to_list()
    shift_ids = [str(shift.id) for shift in shift_models]

    await update_all_users_score()
    print("Shifts:", json.dumps(shift_ids))
    print("Users:", json.dumps(user_ids))

    print(json.dumps({
        "db_shifts_ids": shift_ids,
        "db_users_ids": user_ids
    }, indent=4))


if __name__ == '__main__':
    loop.run_until_complete(main())
