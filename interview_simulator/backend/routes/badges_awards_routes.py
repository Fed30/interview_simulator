from flask import Blueprint, jsonify, request
from firebase_config import firebase_db, storage_bucket
from utils.token_utils import verify_firebase_token
from urllib.parse import quote_plus
from utils.utc_time_utils import get_current_utc_time_with_ntplib


badges_awards_data = Blueprint('badges_awards_data', __name__)

# Update thresholds with corresponding badge names
BADGE_THRESHOLDS = {
    "bronze_badge": 1,
    "silver_badge": 2,
    "gold_badge": 3
}

def format_badge_name(badge_name):
    """Format badge name from 'silver_badge' to 'Silver Badge'."""
    return badge_name.replace('_', ' ').title()

def get_badge_link(user_id, badge_name):
    """Retrieve the badge download URL from user's badge folder in storage."""
    return firebase_db.child(f"Users/{user_id}/Badges/{badge_name}/badge_link").get()

def upload_badge_to_user_storage(user_id, badge_name):
    badge_path = f"Badges/{badge_name}.png"
    user_badge_path = f"Users/{user_id}/Badges/{badge_name}.png"

    try:
        # Check if the badge exists by trying to get the badge
        badge_blob = storage_bucket.blob(badge_path)
        badge_content = badge_blob.download_as_bytes()

        user_badge_blob = storage_bucket.blob(user_badge_path)
        user_badge_blob.upload_from_string(badge_content, content_type="image/png")

        print(f"[SUCCESS] Badge uploaded to: {user_badge_path}")

        # URL encode the user_badge_path
        encoded_path = quote_plus(user_badge_path)

        # Generate the public URL (no expiration)
        badge_url = f"https://firebasestorage.googleapis.com/v0/b/{storage_bucket}/o/{encoded_path}?alt=media"
        print(f"[INFO] Badge URL generated: {badge_url}")

        return badge_url, None

    except Exception as e:
        print(f"[ERROR] Failed to upload badge: {str(e)}")
        return None, f"Failed to upload badge: {str(e)}"


@badges_awards_data.route('/get_badges_awards_data', methods=['POST'])
def get_badges_awards_data():
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

    user_ref = firebase_db.child(f"Users/{user_id}")
    user_data = user_ref.get() or {}

    if not user_data:
        return jsonify({"error": "User data not found in the database"}), 404

    # Count completed sessions
    sessions = user_data.get("Sessions", {})
    sessions_completed = sum(1 for session in sessions.values() if session.get("status") == "Complete")
    print(f"[INFO] Sessions completed: {sessions_completed}")

    badges = user_data.get("Badges", {})
    new_badge = None
    badge_link = None
    awarded_time = None

    # Award badge based on threshold and if not already awarded
    for badge_name, threshold in BADGE_THRESHOLDS.items():
        print(f"[INFO] Checking badge: {badge_name}, threshold: {threshold}, sessions_completed: {sessions_completed}")
        if sessions_completed >= threshold and badge_name not in badges:
            print(f"[INFO] Awarding {badge_name}")
            badge_url, error = upload_badge_to_user_storage(user_id, badge_name)
            if error:
                return jsonify({"error": error}), 500
            
            # Format badge name
            formatted_badge_name = format_badge_name(badge_name)
            awarded_time = get_current_utc_time_with_ntplib()

            # Save badge link to the database
            user_ref.child("Badges").child(badge_name).update({
                "name": formatted_badge_name,
                "badge_link": badge_url,
                "badge_awarded_at": awarded_time
            })

            new_badge = formatted_badge_name
            badge_link = badge_url
            break

    return jsonify({
        "sessions_completed": sessions_completed,
        "new_badge": new_badge,
        "badge_link": badge_link,
        "badge_awarded_at": awarded_time
    }), 200
