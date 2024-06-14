import random
from datetime import datetime, timedelta
from random import randrange
from typing import List, Iterable

import tabulate

from assignments_model.entities import Shift, HogerGuard, Assignment
from assignments_model.guards_manager import OfficerGuardsManager
from assignments_model.stats import guards_score_stddev
from assignments_model.utils.date_utils import iter_dates
from constants.constants import GuardingType

MIN_SHIFTS = 15
MAX_SHIFTS = 17

THURSDAY_WEEKNO = 3
FRIDAY_WEEKNO = 4
SATURDAY_WEEKNO = 5
GUARDS = ["alice", "bob"]


def random_date(start: datetime.date, end: datetime.date) -> datetime.date:
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = randrange(int_delta)
    return start + timedelta(seconds=random_second)


def generate_random_shifts(start_date: datetime.date, end_date: datetime.date) -> List[Shift]:
    shifts = []

    all_possible_dates = list(iter_dates(start_date=start_date, end_date=end_date))
    all_possible_dates = [date for date in all_possible_dates if date.weekday() != SATURDAY_WEEKNO]

    num_shifts = random.randint(MIN_SHIFTS, MAX_SHIFTS)
    for _ in range(num_shifts):
        date = random.choice(all_possible_dates)

        if date.weekday() == THURSDAY_WEEKNO:
            shift_type = random.choices(
                population=[GuardingType.YADIN_THURSDAY, GuardingType.LOTEM_THURSDAY],
                weights=[0.3, 0.6]
            )[0]
        elif date.weekday() == FRIDAY_WEEKNO:
            shift_type = random.choices(
                population=[GuardingType.LOTEM_KAFKAF_WEEKEND, GuardingType.YADIN_WEEKEND, GuardingType.LOTEM_WEEKEND],
                weights=[0.1, 0.4, 0.6]
            )[0]
        else:
            shift_type = random.choices(
                population=[GuardingType.LOTEM_KAFKAF_REGULAR, GuardingType.YADIN_REGULAR, GuardingType.LOTEM_REGULAR],
                weights=[0.1, 0.4, 0.6]
            )[0]

        shift = Shift(date=date, shift_type=shift_type)
        shifts.append(shift)

    return shifts


def generate_guards() -> List[HogerGuard]:
    pass


def print_shifts(shifts: Iterable[Shift]):
    headers = ["Date", "Day of Week", "Type", "Holiday"]
    formatted_list = [
        [shift.date.strftime('%d/%m/%Y'),
         shift.date.strftime('%A'),
         shift.shift_type.name,
         "YES" if shift.is_holiday else ""]
        for shift in shifts
    ]
    print(tabulate.tabulate(formatted_list, headers=headers))
    print()


def print_guards(guards: Iterable[HogerGuard]):
    headers = ["Name", "Regular Score", "Pazam Level", "Pazam Score", "Weekend Score", "Update"]
    formatted_list = [
        [guard.name, guard.regular_score, guard.pazam_level, guard.pazam_score, guard.weekend_score,
         ("+" + str(guard.regular_score - guard.previous_regular_score)) if guard.previous_regular_score else ""]
        for guard in sorted(guards, key=lambda g: g.regular_score, reverse=True)
    ]
    print(tabulate.tabulate(formatted_list, headers=headers))
    print(f"Variance: {guards_score_stddev(guards=guards):.3f}")
    print()


def print_assignments(assignments: Iterable[Assignment]):
    headers = ["Date", "Guard", "Type", "Holiday", "Added score"]
    formatted_list = [
        [assignment.shift.date.strftime('%d/%m/%Y'),
         assignment.guard.name,
         assignment.shift.shift_type.name,
         "YES" if assignment.shift.is_holiday else "",
         f"+" + str(assignment.guard.calculate_regular_score_for_shift(assignment.shift))]
        for assignment in assignments  # if assignment.shift.is_weekend()
    ]
    print(tabulate.tabulate(formatted_list, headers=headers))
    print()


def main():
    start_date = datetime.today().date()
    end_date = start_date + timedelta(days=30)

    for _ in range(5):
        for guard in GUARDS:
            guard.previous_regular_score = None

        shifts = generate_random_shifts(start_date=start_date, end_date=end_date)
        shifts.sort(key=lambda shift: shift.date)

        # Before assignments
        print("******** Before assignments ********")
        print_shifts(shifts=shifts)
        print()
        print_guards(guards=GUARDS)
        print()

        # weekends_manager = WeekendsModel(guards=GUARDS, shifts=shifts)
        # weekends_manager.build_model()
        # weekends_assignments = weekends_manager.solve()
        # print_assignments(assignments=weekends_assignments)
        # print()
        # 
        # for guard in GUARDS:
        #     guard.previous_regular_score = None

        manager = OfficerGuardsManager(guards=GUARDS, shifts=shifts)
        assignments = manager.solve()

        # After assignments
        print("******** After assignments ********")
        GUARDS.sort(key=lambda g: g.regular_score, reverse=True)
        print_assignments(assignments=assignments)
        print()
        print_guards(guards=GUARDS)

        start_date += timedelta(days=31)
        end_date = start_date + timedelta(days=30)


if __name__ == '__main__':
    main()
