from flask import Blueprint, jsonify, request
from firebase_config import firebase_db, firestore_db  # Ensure Firestore is properly initialized
from utils.token_utils import verify_firebase_token
import re

insight_panel_data = Blueprint('insight_panel_data', __name__)

@insight_panel_data.route('/get_insight_panel_data', methods=['GET'])
def get_insight_panel_data():
    # Get the token from request headers
    id_token = request.headers.get('Authorization')
    print(f"Received Token: {id_token}")  # Log the token for debugging

    if not id_token:
        return jsonify({"error": "No authentication token provided"}), 403

    # Extract the token from "Bearer <token>" format
    if id_token.startswith("Bearer "):
        id_token = id_token.split(" ")[1]
    else:
        return jsonify({"error": "Invalid token format"}), 403

    try:
        # Verify the token and get user info
        decoded_token = verify_firebase_token(id_token)
        print(f"Token Issue Time: {decoded_token['iat']}")
        print(f"Token Expiration Time: {decoded_token['exp']}")
        user_id = decoded_token.get('uid')
    except Exception as e:
        print(f"Token verification failed: {str(e)}")
        return jsonify({"error": f"Failed to authenticate token: {str(e)}"}), 403

    # Fetch user data from Firebase Realtime Database
    users_ref = firebase_db.child("Users").child(user_id)
    #user_data = users_ref.get()

    if not users_ref:
        return jsonify({"error": "User data not found"}), 404

    completed_sessions = 0
    incomplete_sessions = 0
    overall_score = 0
    total_grades = []
    
    #sessions = user_data.get("Sessions", {})
    sessions = users_ref.child("Sessions").get() or {}


    if not sessions:
        return jsonify({
            "completed_sessions": completed_sessions,
            "incomplete_sessions": incomplete_sessions,
            "overall_score": overall_score  
        })

    for session_id, session_info in sessions.items():
        status = session_info.get("status")
        session_link = session_info.get("session_link")  # Firestore path

        if status == "Complete":
            completed_sessions += 1
            
            # Fetch session document from Firestore
            if session_link:
                # Extract the relative Firestore path
                match = re.search(r'documents/(.*)', session_link)
                if match:
                    relative_path = match.group(1)
                    try:
                        session_doc = firestore_db.document(relative_path).get()
                        if session_doc.exists:
                            session_data = session_doc.to_dict()
                            history = session_data.get("history", [])

                            # Extract grades from history
                            for entry in history:
                                if "grade" in entry:
                                    try:
                                        grade_value = float(entry["grade"])
                                        total_grades.append(grade_value)
                                    except ValueError:
                                        print(f"Invalid grade format: {entry['grade']}")
                    except Exception as e:
                        print(f"Error fetching session document: {e}")
        elif status == "Incomplete":
            incomplete_sessions += 1
    print("INSIGHT PANEL DATA")        
    print("Total grades",total_grades)
    print("COMPLETE SESSIONS",completed_sessions)
    print("INCOMPLETE SESSIONS",incomplete_sessions)
    # Compute overall average score
    overall_score = round(sum(total_grades) / len(total_grades), 2) if total_grades else 0
    print("Overall score",overall_score)

    return jsonify({
        "completed_sessions": completed_sessions,
        "incomplete_sessions": incomplete_sessions,
        "overall_score": overall_score
    })
