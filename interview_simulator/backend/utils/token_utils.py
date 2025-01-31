from firebase_admin import auth
from utils.utc_time_utils import get_current_utc_time_with_ntplib

def verify_firebase_token(id_token):
    try:
        # Verify the ID token with Firebase
        decoded_token = auth.verify_id_token(id_token)
        print(f"Decoded Token: {decoded_token}")

        # Get the current UTC time (from API or system fallback)
        now = get_current_utc_time_with_ntplib()
        token_iat = decoded_token['iat']  # 'iat' is the issued-at time in the Firebase token
        token_exp = decoded_token['exp']
        
        time_difference = abs(now - token_iat)
        print(f"Time Difference: {time_difference} seconds")

        # Allow a more flexible skew (configurable if needed)
        if time_difference > 60:
            raise Exception("Token used too early or too late")

        # Check if the token has expired
        if now > token_exp:
            raise Exception("Token has expired")

        return decoded_token

    except Exception as e:
        # Log the error and raise the exception
        print(f"Authentication failed: {str(e)}")
        raise