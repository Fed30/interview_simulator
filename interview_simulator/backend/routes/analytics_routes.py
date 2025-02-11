from flask import Blueprint, jsonify, request
from config.firebase_config import firebase_db, firestore_db
from utils.token_utils import verify_firebase_token
from utils.parse_timestamp import parse_timestamp
from utils.match_content_with_grade import match_and_extract_grade
import re
from collections import defaultdict
from utils.question_utils import load_dataset,organize_questions


analytics_panel_data = Blueprint('analytics_panel_data', __name__)


@analytics_panel_data.route('/get_analytics_panel_data', methods=['GET'])
def get_analytics_panel_data():
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

    users_ref = firebase_db.child("Users").child(user_id)
    user_data = users_ref.get()

    if not user_data:
        return jsonify({"error": "User data not found"}), 404

    dataset = load_dataset()
    organized_questions = organize_questions(dataset)

    total_completed_sessions = 0
    total_incomplete_sessions = 0
    session_grades = []
    session_full_dates = []
    session_date_counts = defaultdict(int)
    category_grades = defaultdict(list)
    categories_set = set()
    dataset_categories = set(organized_questions.keys())

    sessions = user_data.get("Sessions", {})
    if not sessions:
        return jsonify({
            "sessionGrade": 0,
            "sessionMonth": [],
            "categoryGrade": {},
            "categories": list(dataset_categories),
            "totalCompletedSession": total_completed_sessions,
            "totalInCompleteSession": total_incomplete_sessions
        })

    session_grades = []  # List of session-specific averages
    #session_full_dates = []  # Keep track of session dates
    session_date_set = set() 

    for session_id, session_info in sessions.items():
        status = session_info.get("status")
        if status == "Complete":
            total_completed_sessions += 1
            session_link = session_info.get("session_link")
            timestamp = session_info.get("timestamp")

            if timestamp:
                session_date = parse_timestamp(timestamp)
                if session_date:
                    session_date_str = session_date.strftime('%d-%m-%y')  # Format date
                    
                    # Append the date to the full list
                    #session_full_dates.append(session_date_str)
                    session_date_set.add(session_date_str)

                    # Increment the session count for that date
                    session_date_counts[session_date_str] += 1  # Ensure each session increments count

            if session_link:
                match = re.search(r'documents/(.*)', session_link)
                if match:
                    relative_path = match.group(1)
                    try:
                        doc_ref = firestore_db.document(relative_path)
                        session_doc = doc_ref.get()

                        if session_doc.exists:
                            session_data = session_doc.to_dict()
                            history = session_data.get("history", [])

                            session_individual_grades = []  # Track grades for this session

                            for entry in history:
                                role = entry.get("role")
                                content = entry.get("content")
                                if role == "assistant" and content:
                                    matched_category, grade_value = match_and_extract_grade(content, history)
                                    if matched_category and grade_value is not None:
                                        session_individual_grades.append(grade_value)
                                        category_grades[matched_category].append(grade_value)
                                        categories_set.add(matched_category)

                            # Compute average grade for this session
                            if session_individual_grades:
                                avg_session_grade = round(sum(session_individual_grades) / len(session_individual_grades), 2)
                                session_grades.append(avg_session_grade)  # Append to session-specific grades list

                    except Exception as e:
                        print(f"Error fetching session document: {e}")
        elif status == "Incomplete":
            total_incomplete_sessions += 1
            
    session_full_dates = sorted(list(session_date_set))

    # Compute category averages
    category_avg_grades = {category: round(sum(grades) / len(grades), 2) for category, grades in category_grades.items()}

    if not categories_set:
        categories_set = dataset_categories

    print("Session Grades:", session_grades)  # This should be a list of per-session averages
    print("Session Dates:", session_full_dates)
    print("Session Dates Count:", session_date_counts)
    print("Category Grade:", category_avg_grades)
    print("Categories:", list(categories_set))
    print("Complete Sessions:", total_completed_sessions)
    print("Incomplete Sessions:", total_incomplete_sessions)

    return jsonify({
        "sessionGrade": session_grades,  # List of per-session average grades
        "sessionDates": session_full_dates,
        "sessionDateCounts": session_date_counts,
        "categoryGrade": category_avg_grades,
        "categories": list(categories_set),
        "totalCompletedSession": total_completed_sessions,
        "totalInCompleteSession": total_incomplete_sessions
    })
