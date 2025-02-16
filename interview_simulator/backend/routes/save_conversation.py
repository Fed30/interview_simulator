from flask import Blueprint, request, jsonify, session
from utils.token_utils import verify_firebase_token
from config.firebase_config import firestore_db, firebase_db
from datetime import datetime
from utils.openai_get_feedback import get_feedback_summary_from_openai
from utils.openai_get_grade import get_grade_from_openai
from utils.question_utils import load_dataset
import os
from dotenv import load_dotenv
import threading
from utils.generate_pdf_report import generate_pdf_report

save_conversation = Blueprint('save_conversation', __name__)


@save_conversation.route('/save_conversation', methods=['POST'])
def save_conversation_route():
    data = request.get_json()
    conversation_history = data.get('conversationHistory')
    
    if not conversation_history:
        return jsonify({"error": "No conversation history provided"}), 400

    user_token = request.headers.get('Authorization')
    if not user_token or not user_token.startswith("Bearer "):
        return jsonify({"error": "Authorization header missing or invalid"}), 401

    try:
        id_token = user_token.split(" ")[1]
        decoded_token = verify_firebase_token(id_token)
        user_id = decoded_token.get('uid')

        # Format date and time
        now = datetime.now()
        formatted_date = now.strftime("%d-%m-%Y")
        formatted_time = now.strftime("%H:%M:%S")
        timestamp = f"{formatted_date} {formatted_time}"

        # Determine the session status
        is_incomplete = any(entry.get("content") == "Session Expired" for entry in conversation_history)
        status = "Incomplete" if is_incomplete else "Complete"

        graded_conversation = conversation_history.copy()

        # Only grade responses if the session is complete
        if not is_incomplete:
            dataset = load_dataset()  # Load dataset once

            for i, msg in enumerate(graded_conversation):
                if msg.get('role') == 'user':  # Only grade user responses
                    user_response = msg.get('content')
                    if user_response:
                        question = (
                            graded_conversation[i - 1].get('content')
                            if i > 0 and graded_conversation[i - 1].get('role') == 'assistant'
                            else "No question provided"
                        )

                        # Find the ideal response from the dataset
                        ideal_response = next(
                            (item['user_answer'] for item in dataset if item['prompt'] == question), None
                        )

                        # Skip grading if no ideal response exists
                        if ideal_response:
                            msg['grade'] = get_grade_from_openai(user_response, ideal_response, question)
                            msg['feedback'] = get_feedback_summary_from_openai(user_response, ideal_response, question)

        # Save to Firestore
        try:
            doc_ref = firestore_db.collection('Sessions').document()
            doc_ref.set({
                'history': graded_conversation,
                'timestamp': timestamp,
                'status': status
            })
        except Exception as e:
            print("Error saving to Firestore:", e)
            return jsonify({"error": "Failed to save conversation to Firestore: " + str(e)}), 500

        # Save session metadata to Firebase Realtime Database
        load_dotenv() 
        doc_id = doc_ref.id
        project_id = os.getenv('FIREBASE_PROJECT_ID', 'default_project_id')

        session_data = {
            'session_link': f'https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/Sessions/{doc_id}',
            'timestamp': timestamp,
            'status': status
        }

        try:
            response = firebase_db.child(f'Users/{user_id}/Sessions').push(session_data)
            firebase_session_id = response.key  
            
            # Only generate the PDF if the session is complete
            if status == "Complete":
                thread = threading.Thread(target=generate_pdf_report, args=(user_id, graded_conversation, timestamp, status, doc_id, firebase_session_id))
                thread.start()
        except Exception as e:
            print("Error saving to Firebase Realtime Database:", e)
            return jsonify({"error": "Failed to save session to Firebase Realtime Database: " + str(e)}), 500

        session.clear()
        return jsonify({"success": True, "conversationId": doc_id}), 200

    except ValueError as e:
        print("Unexpected Error:", e)
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": "Server error: " + str(e)}), 500

