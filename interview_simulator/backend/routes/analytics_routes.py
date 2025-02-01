from flask import Blueprint, jsonify, request
from config.firebase_config import firebase_db, firestore_db
from utils.token_utils import verify_firebase_token
import re
from collections import defaultdict
from datetime import datetime
from utils import question_utils
from fuzzywuzzy import fuzz

analytics_panel_data = Blueprint('analytics_panel_data', __name__)

def clean_text(text):
    return re.sub(r'\s+', ' ', text.strip().lower())  # Replace multiple spaces with a single space

def parse_timestamp(timestamp):
    try:
        if timestamp.isdigit():
            return datetime.fromtimestamp(int(timestamp))
        else:
            return datetime.strptime(timestamp, "%d-%m-%Y %H:%M:%S")
    except Exception as e:
        print(f"Invalid timestamp: {timestamp} - Error: {e}")
        return None

def match_and_extract_grade(content, dataset, history_entry, history):
    # Clean and standardize the content of the assistant's entry
    content = clean_text(content.strip().lower())

    # Loop through the history to find the corresponding user response to the assistant's content
    for idx, entry in enumerate(history):
        # Check if this entry is an assistant response
        if entry.get("role") == "assistant" and clean_text(entry.get("content", "").strip().lower()) == content:
            print("MATCHED CONTENT:", content)
            print("ASSISTANT RESPONSE:", entry.get("content"))

            # Now, look for the corresponding user response in the history
            if idx + 1 < len(history) and history[idx + 1].get("role") == "user":
                user_entry = history[idx + 1]
                print("USER RESPONSE:", user_entry.get("content"))
                # Extract grade from the user response
                grade = user_entry.get("grade")
                print("GRADE:", grade)

                # If a grade exists, return the matched category and the grade
                if grade:
                    # Look for matching dataset entry to find the category
                    for dataset_entry in dataset:
                        dataset_prompt = clean_text(dataset_entry.get("prompt", "").strip().lower())
                        similarity = fuzz.ratio(content, dataset_prompt)
                        if similarity > 80:  # Adjust the threshold as necessary
                            matched_category = dataset_entry.get("category", None)
                            print("CATEGORY:", matched_category)

                            try:
                                return matched_category, float(grade)
                            except ValueError:
                                print(f"Invalid grade format: {grade}")
    return None, None


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

    dataset = question_utils.load_dataset()
    organized_questions = question_utils.organize_questions(dataset)

    total_completed_sessions = 0
    total_incomplete_sessions = 0
    session_grades = []
    session_months = []
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

    for session_id, session_info in sessions.items():
        status = session_info.get("status")
        if status == "Complete":
            total_completed_sessions += 1
            session_link = session_info.get("session_link")
            timestamp = session_info.get("timestamp")

            if timestamp:
                session_date = parse_timestamp(timestamp)
                if session_date:
                    session_months.append(session_date.strftime('%B'))

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
                            
                            for entry in history:
                                role = entry.get("role")
                                content = entry.get("content")
                                if role == "assistant" and content:
                                    matched_category, grade_value = match_and_extract_grade(content, dataset, entry, history)
                                    if matched_category and grade_value is not None:
                                        session_grades.append(grade_value)
                                        category_grades[matched_category].append(grade_value)
                                        categories_set.add(matched_category)
                                    else:
                                        print(f"No matching category found for content: {content}")
                        else:
                            print(f"Document does not exist: {relative_path}")
                    except Exception as e:
                        print(f"Error fetching session document: {e}")
        elif status == "Incomplete":
            total_incomplete_sessions += 1

    session_grade = round(sum(session_grades) / len(session_grades), 2) if session_grades else 0
    category_avg_grades = {category: round(sum(grades) / len(grades), 2) for category, grades in category_grades.items()}

    if not categories_set:
        categories_set = dataset_categories
        
    print("Session Grade:", session_grade)
    print("Session Month:", session_months)
    print("Category Grade:", category_avg_grades)
    print("Categories:", list(categories_set))
    print("Complete Sessions:", total_completed_sessions)
    print("Incomplete Sessions:", total_incomplete_sessions)
    
    return jsonify({
        "sessionGrade": session_grade,
        "sessionMonth": session_months,
        "categoryGrade": category_avg_grades,
        "categories": list(categories_set),
        "totalCompletedSession": total_completed_sessions,
        "totalInCompleteSession": total_incomplete_sessions
    })
