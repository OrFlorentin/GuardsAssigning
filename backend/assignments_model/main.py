import pandas as pd

from assignments_model.entities import ShiftCollection, GuardCollection, OfficerGuardCollection
from assignments_model.guards_manager import OfficerGuardsManager, HapashGuardsManager
from assignments_model.mock import print_shifts, print_assignments


def main():
    officers_table = pd.read_csv('officers_sep_21.csv')
    officer_guards = OfficerGuardCollection.from_df(guards_table=officers_table)

    print("******** Officers - Before assignments ********")
    officer_guards.print_table()

    officers_shifts_table = pd.read_csv('officers_shifts_sep_21.csv', parse_dates=['date'], dayfirst=True)
    officer_shifts = ShiftCollection.from_df(shifts_table=officers_shifts_table)

    officers_manager = OfficerGuardsManager(guards=officer_guards, shifts=officer_shifts, num_search_workers=16)
    assignments = officers_manager.solve()

    print("******** Officers - After assignments ********")
    assignments.print_table()
    officer_guards.print_table()

    guards_table = pd.read_csv('guards_sep_21.csv')
    guards = GuardCollection.from_df(guards_table=guards_table)

    restrictions_table = pd.read_csv('restrictions_sep_21.csv')
    guards.add_restrictions_from_df(restrictions_table=restrictions_table)

    shifts_table = pd.read_csv('shifts_sep_21.csv', parse_dates=['date'], dayfirst=True)
    shifts = ShiftCollection.from_df(shifts_table=shifts_table)

    # Before assignments
    print("******** Hapashes - Before assignments ********")
    print_shifts(shifts=shifts)
    guards.print_table()

    manager = HapashGuardsManager(guards=guards, shifts=shifts, num_search_workers=16)
    assignments = manager.solve()

    # After assignments
    print("******** Hapashes - After assignments ********")
    guards.guards.sort(key=lambda g: g.regular_score, reverse=True)
    print_assignments(assignments=assignments)
    guards.print_table()

    # assignments.to_df().to_csv('assignments.csv', index=False)


if __name__ == '__main__':
    main()
