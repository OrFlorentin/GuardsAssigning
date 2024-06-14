import asyncio
import concurrent.futures
from typing import List, Dict

from beanie import PydanticObjectId
from beanie.odm.operators.find.comparison import In
from fastapi import HTTPException

from assignments_model.constraints import BaseConstraint
from assignments_model.entities import HogerGuard, ShiftCollection, Shift, OfficerGuard, \
    OfficerGuardCollection, BaseGuard, Assignment, HogerGuardCollection
from assignments_model.errors import InfeasibleModelException
from assignments_model.guards_manager import BaseGuardsManager, HogerGuardsManager, \
    OfficerGuardsManager
from models.branch import BranchModel
from models.shift import ShiftModel
from models.structs import PopulationType
from models.user import UserModel


async def auto_assign_shifts(population_type: PopulationType,
                             db_shifts_ids: List[PydanticObjectId],
                             db_users_ids: List[PydanticObjectId],
                             constraints: List[BaseConstraint],
                             overwrite_manual_assignments: bool,
                             branch: BranchModel):
    """
    Assign shifts to guards with automatic assignments model
    :param population_type: population type of users to assign to shifts
    :param db_shifts_ids: ids of ShiftModel objects in DB
    :param db_users_ids: ids of UserModel objects in DB
    :param constraints: List of constraint objects that should be enforced in the model
    :param overwrite_manual_assignments: whether already assigned shifts should be reassigned
    :param branch: branch of guards to assign to shifts
    :return: list of assigned shifts
    """
    # Get DB objects for shifts & guards
    db_shifts = await ShiftModel.find(In(ShiftModel.id, db_shifts_ids), ShiftModel.branch == branch.id).to_list()
    db_users = await UserModel.find(In(UserModel.id, db_users_ids), UserModel.branch == branch.id).to_list()

    assert len(db_shifts) == len(db_shifts_ids) and len(db_users) == len(db_users_ids), \
        "Mismatch between number of given ids and number of found users/shifts in DB"
    assert all(population_type in user.population_types for user in db_users), \
        f"Not all users are part of a '{population_type}' population"
    # TODO: check that all shifts belong to population_type

    # Map DB object id to object
    db_shifts_by_id: Dict[PydanticObjectId, ShiftModel] = {db_shift.id: db_shift for db_shift in db_shifts}

    # Map DB object id to converted assignments_model objects
    model_shifts_by_id = {db_shift.id: await db_shift.to_shift() for db_shift in db_shifts}
    model_guards_by_id = {db_user.id: db_user.to_guard(population_type=population_type) for db_user in db_users}

    shifts: List[Shift] = list(model_shifts_by_id.values())
    guards: List[BaseGuard] = list(model_guards_by_id.values())

    guards_manager: BaseGuardsManager = create_guards_manager(population_type=population_type,
                                                              guards=guards,
                                                              shifts=shifts,
                                                              constraints=constraints)

    if not overwrite_manual_assignments:
        manual_assignments = get_manual_assignments(db_shifts_by_id=db_shifts_by_id,
                                                    model_shifts_by_id=model_shifts_by_id,
                                                    model_guards_by_id=model_guards_by_id)
        # Enforce manual assignments set in advance
        if manual_assignments:
            guards_manager.enforce_assignments(assignments=manual_assignments)

    # Solve model
    try:
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor() as pool:
            assignments = await loop.run_in_executor(pool, guards_manager.solve)
    except InfeasibleModelException as e:
        raise HTTPException(status_code=500, detail=str(e))

    old_assigned_user_ids = set(db_shift.assigned_user_id for db_shift in db_shifts if db_shift.assigned_user_id)
    for assignment in assignments:
        db_shifts_by_id[assignment.shift.id_].assigned_user_id = assignment.guard.id_
        db_shifts_by_id[assignment.shift.id_].score = assignment.guard.calculate_score_for_shift(assignment.shift)

    await ShiftModel.replace_many(list(db_shifts_by_id.values()))  # Save assignments to DB

    # Update calculated score of relevant users
    for user in db_users:
        await user.recalculate_score(population_type=population_type)
    old_db_users_assigned = await UserModel.find(In(UserModel.id, old_assigned_user_ids)).to_list()
    for user in old_db_users_assigned:
        await user.recalculate_score(population_type=population_type)

    return db_shifts


def create_guards_manager(population_type: PopulationType,
                          guards: List[BaseGuard],
                          shifts: List[Shift],
                          constraints: List[BaseConstraint]) -> BaseGuardsManager:
    """
    Create and initialize a GuardsManager according to its type
    :param population_type: population type that will be mapped to guards manager
    :param guards: guards for manager's initialization
    :param shifts: shifts for manager's initialization
    :param constraints: List of constraint objects that should be enforced in the model
    :return: a subclass of BaseGuardsManager of the specified type
    """
    # TODO: validate all shifts are from the same branch and relate to the same model type
    if population_type == PopulationType.HOGER:
        assert all(isinstance(guard, HogerGuard) for guard in guards), "Guard types don't match guards manager type"
        guards: List[HogerGuard]
        return HogerGuardsManager(guards=HogerGuardCollection(guards=guards),
                                  shifts=ShiftCollection(shifts=shifts), constraints=constraints)

    elif population_type == PopulationType.OFFICER:
        assert all(isinstance(guard, OfficerGuard) for guard in guards), "Guard types don't match guards manager type"
        guards: List[OfficerGuard]
        return OfficerGuardsManager(guards=OfficerGuardCollection(guards=guards),
                                    shifts=ShiftCollection(shifts=shifts), constraints=constraints)


def get_manual_assignments(db_shifts_by_id: Dict[PydanticObjectId, ShiftModel],
                           model_shifts_by_id: Dict[PydanticObjectId, Shift],
                           model_guards_by_id: Dict[PydanticObjectId, BaseGuard]) -> List[Assignment]:
    """
    Retrieve assignments set in advance and were saved in DB
    :param db_shifts_by_id: dict that maps DB id of shifts to DB ShiftModel objects
    :param model_shifts_by_id: dict that maps DB id of shifts to assignments model Shift objects
    :param model_guards_by_id: dict that maps DB id of guards to assignments model Guard objects
    :return: list of manual Assignment objects
    """
    manual_assignments = []
    for db_shift_id, db_shift in db_shifts_by_id.items():
        # If assignment was manually set
        if db_shift.assigned_user_id:
            assigned_user_id = db_shift.assigned_user_id
            assert assigned_user_id in model_guards_by_id, f"Assigned guard with id {assigned_user_id}" \
                                                           f" isn't on guards list"
            manual_assignments.append(
                Assignment(
                    shift=model_shifts_by_id[db_shift_id],
                    guard=model_guards_by_id[assigned_user_id]
                )
            )
    return manual_assignments
