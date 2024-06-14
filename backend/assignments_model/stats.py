from typing import Iterable

import numpy as np

from assignments_model.entities import HogerGuard


def guards_score_stddev(guards: Iterable[HogerGuard]):
    return np.std([guard.regular_score for guard in guards])
