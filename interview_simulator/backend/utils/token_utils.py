from firebase_admin import auth
import time

def verify_firebase_token(id_token):
    try:
        # Verify the ID token with Firebase
        decoded_token = auth.verify_id_token(id_token)
        
        # Adjust the validity check by allowing a few seconds of skew
        now = int(time.time())
        token_iat = decoded_token['iat']  # 'iat' is issued at time in Firebase token

        # Allow up to 15 seconds difference between server time and token time
        if abs(now - token_iat) > 15:
            raise Exception("Token used too early")

        return decoded_token

    except Exception as e:
        # Log the error and raise the exception
        print(f"Authentication failed: {str(e)}")
        raise
