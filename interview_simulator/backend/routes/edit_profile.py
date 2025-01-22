import firebase_admin
from flask import Blueprint, request, jsonify
from firebase_admin import auth
import re
from config.firebase_config import  firebase_db

edit_profile = Blueprint('edit_profile', __name__)

# Helper function to validate email
def validate_email(email):
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(email_regex, email) is not None

# Helper function to validate names
def validate_name(name):
    return name and re.match(r'^[a-zA-Z\s]+$', name)  # Allows only letters and spaces


@edit_profile.route('/update_profile', methods=['POST'])
def update_profile():
    # Get the token from the Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Missing or invalid Authorization header"}), 401

    id_token = auth_header.split('Bearer ')[-1]
    try:
        # Verify the token
        decoded_token = auth.verify_id_token(id_token)
        user_id = decoded_token['uid']  # The UID of the authenticated user

        # Extract the request data
        data = request.json
        first_name = data.get('firstName', '').strip()
        last_name = data.get('lastName', '').strip()
        email = data.get('email', '').strip()

        # Validate the data
        if not validate_name(first_name) or not validate_name(last_name):
            return jsonify({"message": "Invalid name format. Only letters and spaces are allowed."}), 400

        if not validate_email(email):
            return jsonify({"message": "Invalid email address."}), 400

        # Reference to the user's data in Firebase Realtime Database
        user_ref = firebase_db.child(f'Users/{user_id}')

        # Update the user's data
        updates = {}
        if first_name:
            updates['firstName'] = first_name
        if last_name:
            updates['lastName'] = last_name
        if email:
            updates['email'] = email

        if updates:
            user_ref.update(updates)  # Apply the updates to the database
            return jsonify({"message": "Profile updated successfully"}), 200
        else:
            return jsonify({"message": "No changes to update."}), 400

    except firebase_admin.exceptions.FirebaseError as e:
        print(f"Firebase error: {e}")
        return jsonify({"message": "Error verifying token or updating profile."}), 500
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "An error occurred."}), 500