from flask import Blueprint, request, jsonify
from utils.token_utils import verify_firebase_token


token_verification = Blueprint('token_verification', __name__)


@token_verification.route('/verify_token', methods=['POST'])
def verify_token():
    # Get the ID token sent from the client
    id_token = request.json.get('idToken')

    if not id_token:
        return jsonify({'error': 'No ID token provided'}), 400

    try:
        # Call the function to verify the token
        decoded_token = verify_firebase_token(id_token)
        
        # If valid, get the UID and respond with success
        uid = decoded_token['uid']
        return jsonify({'message': 'User authenticated successfully', 'uid': uid})

    except Exception as e:
        # Handle token verification failure
        return jsonify({'error': f"Authentication failed: {str(e)}"}), 401
