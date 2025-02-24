from flask import Blueprint, jsonify, request
from firebase_config import firebase_db
from utils.token_utils import verify_firebase_token

badges_data = Blueprint('badges_data', __name__)

@badges_data.route('/get_badges_panel_data', methods=['GET'])
def get_badges_panel_data():
    id_token = request.headers.get('Authorization')
    if not id_token:
        return jsonify({"error": "No authentication token provided"}), 403

    if id_token.startswith("Bearer "):
        id_token = id_token.split(" ")[1]
    else:
        return jsonify({"error": "Invalid token format"}), 403

    try:
        decoded_token = verify_firebase_token(id_token)
        user_id = decoded_token.get('uid')
    except Exception as e:
        return jsonify({"error": f"Failed to authenticate token: {str(e)}"}), 403

    # Fetch user badges from Firebase Realtime Database
    badges_ref = firebase_db.child("Users").child(user_id).child("Badges")
    badges_data = badges_ref.get()

    if not badges_data:
        return jsonify({"Badges": []}), 200  # Return empty if no badges found

    badges_list = []

    for badge_id, badge_info in badges_data.items():
        badge_name = badge_info.get("name", "Unnamed Badge")
        badge_link = badge_info.get("badge_link")

        if badge_link:
            badges_list.append({
                "name": badge_name,
                "badge_link": badge_link
            })

    return jsonify({"Badges": badges_list}), 200
