from ortools.sat.python import cp_model


def calculate_square_from_expression(model: cp_model.CpModel, expr):
    temp_intvar = model.NewIntVar(-100000000, 100000000, '')
    squared_intvar = model.NewIntVar(0, 1000000000, '')

    model.Add(temp_intvar == expr)
    model.AddMultiplicationEquality(squared_intvar, [temp_intvar, temp_intvar])

    return squared_intvar


def calculate_abs_from_expression(model: cp_model.CpModel, expr):
    temp_intvar = model.NewIntVar(-100000000, 100000000, '')
    abs_intvar = model.NewIntVar(0, 10000000000, '')

    model.Add(temp_intvar == expr)
    model.Add(abs_intvar >= expr)
    model.Add(abs_intvar >= -expr)

    return abs_intvar
