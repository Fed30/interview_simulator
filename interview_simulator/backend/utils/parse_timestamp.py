from datetime import datetime


def parse_timestamp(timestamp):
    try:
        return datetime.strptime(timestamp, "%d-%m-%Y %H:%M:%S")
    except Exception as e:
        print(f"Invalid timestamp: {timestamp} - Error: {e}")
        return None