from flask import Blueprint, request, jsonify, session
from utils.question_utils import load_dataset, organize_questions, select_random_questions
from utils.session_utils import check_existing_session, initialize_session
from config.openai_config import openai
from datetime import datetime

chat_routes = Blueprint('chat_routes', __name__)

# Load and organize questions
dataset = load_dataset()
questions_by_category = organize_questions(dataset)

@chat_routes.route('/chat', methods=['GET'])
def initiate_chat():
    # Check if an existing session is valid
    if check_existing_session():
        selected_questions = session['selected_questions']
        current_index = session['current_question_index']
        total_questions = len(selected_questions)  # Dynamically set total questions based on the session
        #total_questions = 2
        progress = 100 if total_questions == 0 else int((current_index / total_questions) * 100)
        next_question = selected_questions[current_index]['prompt']
        
        # Calculate remaining time
        expiry_time = datetime.fromisoformat(session['expiry_time'])
        remaining_time = (expiry_time - datetime.utcnow()).total_seconds()

        return jsonify({
            "message": "Restoring session.",
            "progress": progress,
            "next_question": next_question,
            "conversation_history": session['conversation_history'],
            "remaining_time": remaining_time  # Return remaining time in seconds
        })

    # Initialize a new session if no valid session exists
    selected_questions = select_random_questions(questions_by_category)
    initialize_session(selected_questions)

    initial_question = selected_questions[0]['prompt']
    introduction_message = "Welcome to your personalized Computer Science interview practice session!"

    session['conversation_history'] = [
        {"role": "assistant", "content": introduction_message},
        {"role": "assistant", "content": initial_question}
    ]
    session.modified = True

    # Calculate remaining time for the new session
    expiry_time = datetime.fromisoformat(session['expiry_time'])
    remaining_time = (expiry_time - datetime.utcnow()).total_seconds()

    return jsonify({
        "introduction": introduction_message,
        "initial_question": initial_question,
        "progress": 0,
        "conversation_history": session['conversation_history'],
        "next_question": selected_questions[1]['prompt'] if len(selected_questions) > 1 else None,
        "remaining_time": remaining_time  # Return remaining time in seconds
    })


@chat_routes.route('/chat', methods=['POST'])
def get_chatbot_response():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "Missing message in request"}), 400

    if 'selected_questions' not in session:
        session['selected_questions'] = select_random_questions()
        session['current_question_index'] = 0

    if 'conversation_history' not in session:
        session['conversation_history'] = []

    current_question_index = session['current_question_index']
    total_questions = len(session['selected_questions'])
    #total_questions = 2

    if total_questions == 0:
        return jsonify({"error": "No questions available."}), 400

    # Get user input
    user_input = data.get('message', '').strip()
    if not user_input:
        return jsonify({"error": "No valid input provided"}), 400

    # Save user response
    session['conversation_history'].append({"role": "user", "content": user_input})

    # Handle final message when questions are done
    if current_question_index >= total_questions:
        final_message = "That's the end of the practice interview. Great job answering all the questions!"
        session['conversation_history'].append({"role": "assistant", "content": final_message})
        session.modified = True  # Ensure session changes are saved
        
        # Clear session to reset for new interview
        session.clear()

        return jsonify({
            "chatbot_response": final_message,
            "final_message": final_message,
            "progress": 100,
            "next_question": None
        })

    # Process current question
    current_question = session['selected_questions'][current_question_index]
    dataset_response = current_question['completion']

    try:
        conversation_history = session['conversation_history']
        messages = [{"role": "system", "content": "You are an AI interview coach. Respond assertively without asking follow-up questions. Just provide feedback based on the dataset."}] + \
                [{"role": msg["role"], "content": msg["content"]} for msg in conversation_history]
        openai_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=150
        )
        chatbot_response = openai_response.choices[0].message.content.strip()
        full_response = f"{chatbot_response} {dataset_response}"

        # Save bot response
        session['conversation_history'].append({"role": "assistant", "content": chatbot_response})

    except Exception as e:
        full_response = f"Error: {str(e)}"

    # Move to the next question and calculate progress
    session['current_question_index'] += 1
    current_question_index = session['current_question_index']
    progress = 100 if total_questions == 0 else int((current_question_index / total_questions) * 100)
    session.modified = True  # Save session changes

    next_question = session['selected_questions'][current_question_index]['prompt'] if current_question_index < total_questions else None
    if next_question:
        session['conversation_history'].append({"role": "assistant", "content": next_question})
    final_message = "That's the end of the practice interview. Great job answering all the questions!"

    return jsonify({
        "chatbot_response": full_response,
        "next_question": next_question,
        "final_message": final_message,
        "progress": progress,
        "conversation_history": session['conversation_history']
    })
