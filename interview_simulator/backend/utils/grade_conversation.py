from firebase_config import firestore_db, firebase_db
from utils.openai_get_feedback import get_feedback_summary_from_openai
from utils.openai_get_grade import get_grade_from_openai
import os

def grade_conversation(user_id, graded_conversation, dataset, doc_id, firebase_session_id):
    # Iterate through the conversation to grade the user's responses
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
                    try:
                        # Grade the response and get feedback
                        msg['grade'] = get_grade_from_openai(user_response, ideal_response, question)
                        msg['feedback'] = get_feedback_summary_from_openai(user_response, ideal_response, question)
                    except Exception as e:
                        print(f"Error grading or generating feedback for message {i}: {e}")
                        # Optionally, handle error with a default value or skip grading
                        msg['grade'] = 'Error'
                        msg['feedback'] = 'Error in grading/feedback'

    # Update Firestore after grading is complete
    try:
        doc_ref = firestore_db.collection("Sessions").document(doc_id)
        doc_ref.update({"history": graded_conversation})
        doc_ref_id = doc_ref.id
    except Exception as e:
        print(f"Error updating Firestore: {e}")
        return None  # Return None or handle the failure case as needed

    # Prepare session data for Firebase Realtime Database
    project_id = os.getenv('FIREBASE_PROJECT_ID', 'default_project_id')
    session_data = {
        'session_link': f'https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/Sessions/{doc_ref_id}'
    }

    # Update Firebase Realtime Database with session data
    try:
        firebase_db.child(f'Users/{user_id}/Sessions/{firebase_session_id}').update({session_data})
    except Exception as e:
        print(f"Error updating Firebase Realtime Database: {e}")
        return None  # Return None or handle the failure case as needed

    return graded_conversation
