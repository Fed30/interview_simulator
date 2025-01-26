from flask import Blueprint, request, jsonify, session
from utils.token_utils import verify_firebase_token
from config.firebase_config import firestore_db, firebase_db
from datetime import datetime
from utils.openai_get_feedback import get_feedback_summary_from_openai
from utils.openai_get_grade import get_grade_from_openai
from utils.question_utils import load_dataset

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

        # Determine the status based on the conversation content
        status = "Incomplete" if any(entry.get("content") == "Session Expired" for entry in conversation_history) else "Complete"
        
        # Load the dataset
        dataset = load_dataset() 

        # Grade each user response in the conversation history
        graded_conversation = []
        for i, msg in enumerate(conversation_history):
            if msg.get('role') == 'user':  # Only grade user responses
                user_response = msg.get('content')
                if user_response:
                    question = conversation_history[i-1].get('content') if i > 0 and conversation_history[i-1].get('role') == 'assistant' else "No question provided"
                    
                    # Find the ideal response based on the question from the dataset
                    ideal_response = next((item['user_answer'] for item in dataset if item['prompt'] == question), None)
                    
                    # If no ideal response is found,  handle this as an error or default behavior
                    if ideal_response is None:
                        return jsonify({"error": "Ideal response not found for the question."}), 400
                    
                    # Get the grade and feedback summary for each user response
                    grade = get_grade_from_openai(user_response,ideal_response, question)  # Get grade
                    feedback = get_feedback_summary_from_openai(user_response,ideal_response, question)  # Get feedback summary

                    # Add grade and feedback to the message
                    msg['grade'] = grade  
                    msg['feedback'] = feedback  

            graded_conversation.append(msg)

        # Save to Firestore
        doc_ref = firestore_db.collection('Sessions').add({
            'history': graded_conversation,  # Save graded conversation history
            'timestamp': timestamp,  # Use formatted timestamp
            'status': status  # Add status field
        })

        doc_id = doc_ref[1].id

        # Save to Realtime Database
        firebase_db.child(f'Users/{user_id}/Sessions').push({
            'session_link': f'https://firestore.googleapis.com/v1/projects/project_id/databases/(default)/documents/Sessions/{doc_id}',
            'timestamp': timestamp,  # Use formatted timestamp
            'status': status,  # Add status field
        })

        session.clear()
        return jsonify({"success": True, "conversationId": doc_id}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": "Server error: " + str(e)}), 500

