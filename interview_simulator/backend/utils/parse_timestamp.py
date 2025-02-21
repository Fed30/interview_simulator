from datetime import datetime


def parse_timestamp(timestamp):
    try:
        return datetime.strptime(timestamp, '%d-%m-%Y %H:%M:%S')
    except ValueError:
        return None