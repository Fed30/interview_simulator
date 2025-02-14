from flask import Blueprint, jsonify, request
from config.firebase_config import firebase_db
from utils.token_utils import verify_firebase_token
from utils.parse_timestamp import parse_timestamp

feedback_data = Blueprint('feedback_data', __name__)

@feedback_data.route('/get_feedback_panel_data', methods=['GET'])
def get_feedback_panel_data():
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

    # Fetch user sessions from Firebase Realtime Database
    users_ref = firebase_db.child("Users").child(user_id)
    user_data = users_ref.get()

    if not user_data:
        return jsonify({"error": "User data not found"}), 404

    sessions = user_data.get("Sessions", {})

    # Lists to store formatted timestamps and session data (including report link for completed sessions)
    completed_sessions = []
    incomplete_sessions = []

    total_completed_sessions = 0
    total_incomplete_sessions = 0

    for session_id, session_info in sessions.items():
        status = session_info.get("status")
        timestamp = session_info.get("timestamp")
        report_link = session_info.get("report_link", None)  # Fetch report_link

        formatted_date = None
        if timestamp:
            parsed_date = parse_timestamp(timestamp)
            if parsed_date:
                formatted_date = parsed_date.strftime('%d-%m-%y')

        if status == "Complete":
            total_completed_sessions += 1
            session_data = {"date": formatted_date}
            if report_link:
                session_data["report_link"] = report_link  # Add report_link if exists
            completed_sessions.append(session_data)
        
        elif status == "Incomplete":
            total_incomplete_sessions += 1
            if formatted_date:
                incomplete_sessions.append({"date": formatted_date})

    return jsonify({
        "completedSessions": {
            "count": total_completed_sessions,
            "sessions": completed_sessions
        },
        "incompleteSessions": {
            "count": total_incomplete_sessions,
            "sessions": incomplete_sessions
        }
    })
