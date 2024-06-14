import abc
import inspect
import timeit
from abc import abstractmethod
from itertools import product
from typing import Dict, Tuple, List, Iterable

from ortools.linear_solver.linear_solver_natural_api import SumArray
from ortools.sat.python import cp_model
from ortools.sat.python.cp_model import IntVar

from assignments_model.constraints import GuardsPerShiftConstraint, ShiftsPerGuardPerDayConstraint, \
    BaseConstraint, ShiftsPerGuardPerMonthConstraint, NoSpecificDayAfterSpecificDayConstraint, \
    SpecificShiftsInServiceConstraint, LimitRealOfficerGuardingGroupPerMonthConstraint, \
    SpecificDayPerGuardPerMonthWithHistoryConstraint, NoSpecificShiftsAfterSpecificShiftsConstraint, \
    LimitOnlyOneHolidayInService
from assignments_model.entities import BaseGuardCollection, UnifiedScoreGuardCollection
from assignments_model.entities import Shift, BaseGuard, Assignment, ShiftCollection, AssignmentCollection
from assignments_model.errors import InfeasibleModelException
from assignments_model.query import UnionQuery, ShiftQuery
from assignments_model.utils import model_utils
from constants.constants import SCALAR, Weekday
from models.score import DayTypeEnum
from models.structs import ShiftTypeNameEnum


class GuardsAssignmentsModel(abc.ABC):
    """
    An abstract class with common definitions for guards assignment models' functions & variables

    The problem that the model should solve is to place True or False on a 2D boolean array of guards
    and allocated shifts, where True means that a guard was assigned to a shift, and False means that he wasn't.
    """

    def __init__(self,
                 shifts: ShiftCollection,
                 guards: BaseGuardCollection,
                 *,
                 num_search_workers: int = 8,
                 timeout_in_seconds: float = 10.0,
                 is_debug: bool = False):
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        self.shifts = shifts
        self.guards = guards
        self.is_debug = is_debug

        self.solver.parameters.num_search_workers = num_search_workers  # Number of allocated solver threads
        self.solver.parameters.max_time_in_seconds = timeout_in_seconds  # Timeout in seconds

        # 2D mapping of given shifts and guards to booleans
        self.assignment_vars: Dict[Tuple[Shift, BaseGuard], IntVar] = {
            (shift, guard): self.model.NewBoolVar(f'{shift.formatted_date()}_guard_{guard.name}')
            for shift, guard in product(self.shifts, self.guards)
        }

        # Initialize constraints list
        self.constraints: List[BaseConstraint] = []

    @abstractmethod
    def build_model(self):
        raise NotImplementedError

    def apply_constraints(self):
        """
        Iterates throw the model's constrains and applies it
        """
        for constraint in self.constraints:
            constraint.validate_parameters()
            constraint.apply_constraint(self)

    @abstractmethod
    def add_base_constraints(self):
        """
        Add base binding constraints for every model
        """

        self.constraints += [
            # One guard per shift
            GuardsPerShiftConstraint(guards_per_shift=1),
            # One shift for a guard in one day
            ShiftsPerGuardPerDayConstraint(min_shifts_per_day=0, max_shifts_per_day=1)
        ]

    def add_constraints(self, constraints: List[BaseConstraint]):
        self.constraints += constraints

    @abstractmethod
    def add_objective_function(self):
        """
        Sets the objective function for the model (using model.Maximize()/model.Minimize())
        """
        raise NotImplementedError

    def add_restrictions(self, shifts: Iterable[Shift], guard: BaseGuard):
        """
        Restrict model to not assign a guard to a given list of shifts
        :param shifts: list of shifts
        :param guard: a guard that won't be assigned to given shifts
        """
        for shift in shifts:
            self.model.Add(self.assignment_vars[shift, guard] == 0).OnlyEnforceIf(self.infeasibility_debug_var())

    def enforce_assignment(self, assignment: Assignment):
        """
        Enforce given assignment on model
        :param assignment: assignment to be enforced when model is solved
        """
        assert (assignment.shift, assignment.guard) in self.assignment_vars, "No variable was found for assignment"
        self.model.Add(self.assignment_vars[assignment.shift, assignment.guard] == 1).OnlyEnforceIf(
            self.infeasibility_debug_var())

    def enforce_assignments(self, assignments: List[Assignment]):
        """
        Enforce given assignments on model
        :param assignments: list of assignments to be enforced when model is solved
        :return:
        """
        for assignment in assignments:
            self.enforce_assignment(assignment=assignment)

    def _calculate_square_from_expression(self, expr):
        """
        Calculate variable that will equal to the square of a given ortools expression
        :param expr: expression to be squared
        :return: an IntVar that will be equal to square of expression
        """
        return model_utils.calculate_square_from_expression(model=self.model, expr=expr)

    def _calculate_abs_min_from_expression(self, expr):
        """
        Calculate variable that will equal to the absolute value of a given ortools expression
        **only** when the result will be an addend of an objective function that will be minimized
        :param expr: ortools expression
        :return: an IntVar that will be equal to the absolute value of expression
        """
        return model_utils.calculate_abs_from_expression(model=self.model, expr=expr)

    def calculate_objective_variance_from_expressions(self, linear_expressions: List[SumArray]) -> SumArray:
        """
        Calculate variance from a list of expressions, **only** should the variance be an objective function that
        will be minimized
        :param linear_expressions: list of ortools expressions
        :return: expression of a variance function to minimize
        """
        avg_expressions = self.model.NewIntVar(0, 100000000, 'avg_expressions')
        sum_expressions = self.model.NewIntVar(0, 100000000, 'sum_expressions')

        # Calculate sum of weekend scores post assignment
        self.model.Add(sum_expressions == sum(linear_expressions)).OnlyEnforceIf(self.infeasibility_debug_var())

        # Divide the sum by the number of guards
        self.model.AddDivisionEquality(avg_expressions, sum_expressions, len(linear_expressions))

        function_to_minimize = sum(
            self._calculate_abs_min_from_expression(expr=expression - avg_expressions)
            for expression in linear_expressions
        )

        return function_to_minimize

    def infeasibility_debug_var(self):
        """
        An ortools' BoolVar that is useful for debugging the model when it's INFEASIBLE
        :return: a debug variable with useful information
        """
        if not self.is_debug:
            return True

        caller_function_name = inspect.stack()[1][3]
        caller_function_line_number = inspect.stack()[1].lineno
        name = f"{caller_function_name}_line_{caller_function_line_number}"
        var = self.model.NewBoolVar(name)
        self.model.AddAssumption(var)
        return var

    def solve(self) -> AssignmentCollection:
        """
        Solve assignements for model, and end program if the model is infeasible with debugging information for model
        :return: list of assignments
        """
        self.model.Validate()

        time_before_solve = timeit.default_timer()
        status = self.solver.Solve(self.model)
        time_after_solve = timeit.default_timer()
        # print(self.solver.ResponseStats())

        if status == cp_model.INFEASIBLE:
            sufficient_assumptions = self.solver.SufficientAssumptionsForInfeasibility()
            for ass in sufficient_assumptions:
                print(self.model.GetBoolVarFromProtoIndex(ass))
            raise InfeasibleModelException("Model is infeasible with given parameters")

        else:
            print(f"Solving took {time_after_solve - time_before_solve:.3f} seconds.")
            # print("Objective", self.solver.ObjectiveValue())
            assignments = []
            for shift, guard in product(self.shifts, self.guards):
                if self.solver.Value(self.assignment_vars[shift, guard]):
                    assignments.append(Assignment(shift=shift, guard=guard))
            return AssignmentCollection(assignments=assignments)


class UnifiedScoreRegularModel(GuardsAssignmentsModel):
    """
    Model for regular (Sundays-Thursdays & not holidays) guards assignment problem
    """

    def __init__(self, shifts: ShiftCollection, guards: UnifiedScoreGuardCollection, **kwargs):
        self.guards = guards
        super().__init__(shifts=shifts, guards=guards, **kwargs)

    def build_model(self):
        """
        Add all constraints and objective function to model
        """
        self.add_base_constraints()
        self.apply_constraints()
        self.add_objective_function()

    def add_base_constraints(self):
        """
        Add constraints relevant to assigning "regular" shifts
        """
        super().add_base_constraints()

        # Apply restrictions to dates from guards' requests
        for guard in self.guards:
            for date in guard.restrictions:
                self.add_restrictions(shifts=self.shifts.find(date=date), guard=guard)

    def _generate_post_assignment_vars(self):
        """
        Calculate regular justice table to be used for calculation of score variance
        :return: mapping of guards to their new theoretic regular scores as an ortools' IntVar expression
        """
        post_assignment_regular_scores = {}

        for guard in self.guards:
            score_to_add = sum(
                int(SCALAR * guard.calculate_score_for_shift(shift=shift).regular_score)
                * self.assignment_vars[shift, guard]
                for shift in self.shifts
            )

            new_regular_score = self.model.NewIntVar(0, 1000000000, '')
            self.model.Add(new_regular_score == (int(SCALAR * guard.score.regular_score) + score_to_add))

            weighted_regular_score = self.model.NewIntVar(0, 1000000000, '')
            self.model.AddDivisionEquality(weighted_regular_score, new_regular_score, guard.time_in_duty + 1)

            post_assignment_regular_scores[guard] = weighted_regular_score

        return post_assignment_regular_scores

    def add_objective_function(self):
        """
        Adds objective function to model
        """
        post_assignment_vars = self._generate_post_assignment_vars()
        function_to_minimize = self.calculate_objective_variance_from_expressions(list(post_assignment_vars.values()))
        self.model.Minimize(function_to_minimize)

    @staticmethod
    def get_default_constraints() -> List[BaseConstraint]:
        return [
            ShiftsPerGuardPerMonthConstraint(
                min_shifts_per_month=0,
                max_shifts_per_month=1,
                shifts_query=UnionQuery(
                    queries=[
                        ShiftQuery(
                            day_types=(DayTypeEnum.THURSDAY, DayTypeEnum.WEEKEND)
                        ),
                        ShiftQuery(
                            is_holiday=True
                        )
                    ]
                )
            ),
            NoSpecificDayAfterSpecificDayConstraint(
                first_day=Weekday.FRIDAY_WEEKDAY,
                second_day=Weekday.SUNDAY_WEEKDAY,
                day_interval=2
            )
        ]


class UnifiedScoreWeekendsModel(GuardsAssignmentsModel):
    """
    Model for weekends & holidays guards assignment problem
    """

    def __init__(self, shifts: ShiftCollection, guards: UnifiedScoreGuardCollection, **kwargs):
        self.guards: UnifiedScoreGuardCollection = guards
        self.shifts = ShiftCollection([shift for shift in shifts if shift.is_weekend() or shift.is_holiday])

        super().__init__(shifts=self.shifts, guards=self.guards, **kwargs)

    def build_model(self):
        """
        Add all constraints and objective function to model
        """
        self.add_base_constraints()
        self.apply_constraints()
        self.add_objective_function()

    def add_base_constraints(self):
        """
        Add constraints relevant to assigning weekends & holiday shifts
        """
        super().add_base_constraints()

        # Apply restrictions to dates from guards' requests
        for guard in self.guards:
            for date in guard.restrictions:
                self.add_restrictions(shifts=self.shifts.find(date=date).to_list(), guard=guard)

    def _generate_post_assignment_vars(self):
        """
        Calculate weekend justice table to be used for calculation of score variance
        :return: mapping of guards to their new theoretic weekend scores as an ortools' IntVar expression
        """
        post_assignment_weekend_scores = {}

        for guard in self.guards:
            score_to_add = sum(
                int(SCALAR * guard.calculate_score_for_shift(shift=shift).weekend_score)
                * self.assignment_vars[shift, guard]
                for shift in self.shifts
            )
            new_weekend_score = self.model.NewIntVar(0, 1000000000, '')
            self.model.Add(new_weekend_score == (int(SCALAR * guard.score.weekend_score) + score_to_add))

            weighted_weekend_score = self.model.NewIntVar(0, 1000000000, '')
            self.model.AddDivisionEquality(weighted_weekend_score, new_weekend_score, guard.time_in_duty)

            post_assignment_weekend_scores[guard] = weighted_weekend_score

        return post_assignment_weekend_scores

    def add_objective_function(self):
        """
        Adds objective function to model
        """
        post_assignment_vars = self._generate_post_assignment_vars()
        function_to_minimize = self.calculate_objective_variance_from_expressions(list(post_assignment_vars.values()))
        self.model.Minimize(function_to_minimize)

    @staticmethod
    def get_default_constraints() -> List[BaseConstraint]:
        return [
            ShiftsPerGuardPerMonthConstraint(
                min_shifts_per_month=0,
                max_shifts_per_month=1,
                shifts_query=UnionQuery(
                    queries=[
                        ShiftQuery(
                            day_types=(DayTypeEnum.THURSDAY, DayTypeEnum.WEEKEND)
                        ),
                        ShiftQuery(
                            is_holiday=True
                        )
                    ]
                )
            ),
            SpecificShiftsInServiceConstraint(
                max_shifts_in_service=1,
                shifts_query=ShiftQuery(is_holiday=True)
            )
        ]

# TODO these should probably be deleted


class OfficersRegularModel(UnifiedScoreRegularModel):
    def add_base_constraints(self):
        """
        Add constraints relevant to assigning regular shifts
        """
        super().add_base_constraints()

    @staticmethod
    def get_default_constraints():
        return super(OfficersRegularModel, OfficersRegularModel).get_default_constraints() + [
            LimitRealOfficerGuardingGroupPerMonthConstraint(
                min_shift_per_month=0,
                max_shift_per_month=0,
                shifts_query=ShiftQuery(shift_types=(ShiftTypeNameEnum.ZUTAR_OFFICER,))
            ),
            ShiftsPerGuardPerMonthConstraint(
                min_shifts_per_month=0,
                max_shifts_per_month=2,
            ),
        ]


class OfficersWeekendModel(UnifiedScoreWeekendsModel):
    def add_base_constraints(self):
        """
        Add constraints relevant to assigning weekends & holiday shifts
        """
        super().add_base_constraints()

    @staticmethod
    def get_default_constraints():
        return super(OfficersWeekendModel, OfficersWeekendModel).get_default_constraints() + [
            LimitRealOfficerGuardingGroupPerMonthConstraint(
                min_shift_per_month=0,
                max_shift_per_month=0,
                shifts_query=ShiftQuery(shift_types=(ShiftTypeNameEnum.ZUTAR_OFFICER,))
            ),
            SpecificDayPerGuardPerMonthWithHistoryConstraint(
                min_days_per_month=0,
                max_days_per_month=3,
                day=Weekday.FRIDAY_WEEKDAY,
                history_days=90
            ),
        ]


class HogersRegularModel(UnifiedScoreRegularModel):
    def add_base_constraints(self):
        """
        Add constraints relevant to assigning regular shifts
        """
        super().add_base_constraints()

    @staticmethod
    def get_default_constraints():
        return super(HogersRegularModel, HogersRegularModel).get_default_constraints() + [
            ShiftsPerGuardPerMonthConstraint(
                min_shifts_per_month=0,
                max_shifts_per_month=3
            ),
            NoSpecificShiftsAfterSpecificShiftsConstraint(
                first_shifts_query=ShiftQuery(shift_types=(ShiftTypeNameEnum.YADIN_HOGER,)),
                second_shifts_query=ShiftQuery(shift_types=(ShiftTypeNameEnum.LOTEM_HOGER,
                                                            ShiftTypeNameEnum.LOTEM_HOGER_KAFKAF,)),
                day_interval=1
            ),
        ]


class HogersWeekendModel(UnifiedScoreWeekendsModel):
    def add_base_constraints(self):
        """
        Add constraints relevant to assigning regular shifts
        """
        super().add_base_constraints()

    @staticmethod
    def get_default_constraints():
        return super(HogersWeekendModel, HogersWeekendModel).get_default_constraints() + [
            ShiftsPerGuardPerMonthConstraint(
                min_shifts_per_month=0,
                max_shifts_per_month=3
            ),
            SpecificDayPerGuardPerMonthWithHistoryConstraint(
                min_days_per_month=0,
                max_days_per_month=2,
                day=Weekday.FRIDAY_WEEKDAY,
                history_days=60
            ),
            ShiftsPerGuardPerMonthConstraint(
                min_shifts_per_month=0,
                max_shifts_per_month=2,
                shifts_query=ShiftQuery(shift_types=(ShiftTypeNameEnum.YADIN_HOGER,))
            ),
            NoSpecificShiftsAfterSpecificShiftsConstraint(
                first_shifts_query=ShiftQuery(shift_types=(ShiftTypeNameEnum.YADIN_HOGER,)),
                second_shifts_query=ShiftQuery(shift_types=(ShiftTypeNameEnum.LOTEM_HOGER,
                                                            ShiftTypeNameEnum.LOTEM_HOGER_KAFKAF,)),
                day_interval=1
            ),
            SpecificShiftsInServiceConstraint(max_shifts_in_service=1, shifts_query=ShiftQuery(is_holiday=True)),
            LimitOnlyOneHolidayInService()
        ]
