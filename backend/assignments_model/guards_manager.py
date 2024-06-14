from typing import Optional, Iterable, List

from assignments_model.constraints import BaseConstraint
from assignments_model.entities import Assignment, ShiftCollection, AssignmentCollection, BaseGuardCollection, \
    UnifiedScoreGuardCollection, OfficerGuardCollection
from assignments_model.models import UnifiedScoreWeekendsModel, UnifiedScoreRegularModel, \
    GuardsAssignmentsModel, OfficersWeekendModel, OfficersRegularModel, HogersWeekendModel, HogersRegularModel


class BaseGuardsManager:
    """
    A manager for all models related to the same set of guards and shifts
    """

    def __init__(self,
                 weekends_model: GuardsAssignmentsModel,
                 regular_model: GuardsAssignmentsModel,
                 guards: BaseGuardCollection,
                 shifts: ShiftCollection,
                 constraints: List[BaseConstraint],
                 ):
        self.guards = guards
        self.shifts = shifts

        if self.guards is None:
            self.guards = BaseGuardCollection()

        if self.shifts is None:
            self.shifts = ShiftCollection()

        self.weekends_model = weekends_model
        self.regular_model = regular_model

        # TODO differentiate constraints between weekend and regular models
        self.regular_model.add_constraints(constraints)
        self.weekends_model.add_constraints(constraints)

    def _prepare_regular_model(self):
        self.regular_model.build_model()

    def _prepare_weekends_model(self):
        self.weekends_model.build_model()

    def enforce_assignment(self, assignment: Assignment):
        if assignment.shift.is_weekend():
            self.weekends_model.enforce_assignment(assignment=assignment)
        self.regular_model.enforce_assignment(assignment=assignment)

    def enforce_assignments(self, assignments: Iterable[Assignment]):
        for assignment in assignments:
            self.enforce_assignment(assignment=assignment)

    def solve(self) -> Optional[AssignmentCollection]:
        self._prepare_weekends_model()
        weekends_assignments = self.weekends_model.solve()

        if weekends_assignments:
            self.enforce_assignments(assignments=weekends_assignments)

        self._prepare_regular_model()
        final_assignments = self.regular_model.solve()

        for assignment in final_assignments:
            assignment.guard.apply_shift(shift=assignment.shift)

        return final_assignments


class UnifiedScoreGuardsManager(BaseGuardsManager):
    def __init__(self,
                 guards: UnifiedScoreGuardCollection,
                 shifts: ShiftCollection,
                 constraints: List[BaseConstraint],
                 num_search_workers: int = 8
                 ):
        weekends_model = UnifiedScoreWeekendsModel(shifts=shifts,
                                                   guards=guards,
                                                   num_search_workers=num_search_workers)
        regular_model = UnifiedScoreRegularModel(shifts=shifts,
                                                 guards=guards,
                                                 num_search_workers=num_search_workers)
        super().__init__(weekends_model=weekends_model, regular_model=regular_model, guards=guards, shifts=shifts,
                         constraints=constraints)


# TODO these should probably be deleted
class OfficerGuardsManager(BaseGuardsManager):
    def __init__(self,
                 guards: OfficerGuardCollection,
                 shifts: ShiftCollection,
                 constraints: List[BaseConstraint],
                 num_search_workers: int = 8
                 ):
        weekends_model = OfficersWeekendModel(shifts=shifts,
                                              guards=guards,
                                              num_search_workers=num_search_workers)
        regular_model = OfficersRegularModel(shifts=shifts,
                                             guards=guards,
                                             num_search_workers=num_search_workers)
        super().__init__(weekends_model=weekends_model, regular_model=regular_model, guards=guards, shifts=shifts,
                         constraints=constraints)


class HogerGuardsManager(BaseGuardsManager):
    def __init__(self,
                 guards: UnifiedScoreGuardCollection,
                 shifts: ShiftCollection,
                 constraints: List[BaseConstraint],
                 num_search_workers: int = 8
                 ):
        weekends_model = HogersWeekendModel(shifts=shifts,
                                            guards=guards,
                                            num_search_workers=num_search_workers)
        regular_model = HogersRegularModel(shifts=shifts,
                                           guards=guards,
                                           num_search_workers=num_search_workers)
        super().__init__(weekends_model=weekends_model, regular_model=regular_model, guards=guards, shifts=shifts,
                         constraints=constraints)
