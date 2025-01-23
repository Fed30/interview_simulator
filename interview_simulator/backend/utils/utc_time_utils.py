import ntplib
import time

def get_current_utc_time_with_ntplib():
    """
    Fetch the current UTC time from an NTP server. If it fails, fallback to system time.
    """
    ntp_client = ntplib.NTPClient()
    ntp_servers = [
        "pool.ntp.org",  # Main NTP server
        "time.nist.gov",  # Backup NTP server
    ]

    for server in ntp_servers:
        try:
            response = ntp_client.request(server, version=3)
            # Convert NTP timestamp to Unix timestamp
            return int(response.tx_time)
        except Exception as e:
            print(f"Failed to fetch time from NTP server {server}: {e}")

    # Fallback to system time if all NTP servers fail
    print("Using system UTC time as a fallback.")
    return int(time.time())
