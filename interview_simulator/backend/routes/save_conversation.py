from flask import Blueprint, request, jsonify, session
from utils.token_utils import verify_firebase_token
from config.firebase_config import firestore_db, firebase_db
from datetime import datetime

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

        doc_ref = firestore_db.collection('Sessions').add({
            'history': conversation_history,
            'timestamp': datetime.now().isoformat()
        })

        doc_id = doc_ref[1].id
        firebase_db.child(f'Users/{user_id}/Sessions').push({
            'session_link': f'https://firestore.googleapis.com/v1/projects/project_id/databases/(default)/documents/Sessions/{doc_id}',
            'timestamp': datetime.now().isoformat()
        })

        session.clear()
        return jsonify({"success": True, "conversationId": doc_id}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": "Server error: " + str(e)}), 500
