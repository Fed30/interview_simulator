from firebase_admin import auth
from utils.utc_time_utils import get_current_utc_time_with_ntplib

def verify_firebase_token(id_token):
    try:
        # Verify the ID token with Firebase
        decoded_token = auth.verify_id_token(id_token)

        # Get the current UTC time (from API or system fallback)
        now = get_current_utc_time_with_ntplib()
        token_iat = decoded_token['iat']  # 'iat' is the issued-at time in the Firebase token

        # Allow up to 15 seconds skew between token time and server time
        if abs(now - token_iat) > 15:
            raise Exception("Token used too early or too late")

        return decoded_token

    except Exception as e:
        # Log the error and raise the exception
        print(f"Authentication failed: {str(e)}")
        raise
