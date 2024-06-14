from datetime import timedelta
import dateparser


def iter_dates(start_date, end_date):
    for n in range(int((end_date - start_date).days) + 1):
        yield start_date + timedelta(n)


def parse_date(date: str):
    date = date.replace('.', '/')
    return dateparser.parse(date, settings={'DATE_ORDER': 'DMY'})


def parse_date_restrictions(restrictions: str):
    dates = []
    tokens = [token.strip().replace(' ', '') for token in restrictions.split(',')]
    for token in tokens:
        if '-' in token:
            start, end = token.split('-')
            dates.extend(list(iter_dates(start_date=parse_date(start), end_date=parse_date(end))))
        else:
            dates.append(parse_date(token))
    return dates
