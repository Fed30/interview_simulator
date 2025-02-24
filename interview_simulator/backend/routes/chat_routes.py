from flask import Blueprint, request, jsonify, session
from utils.question_utils import load_dataset, organize_questions, select_random_questions
from utils.session_utils import check_existing_session, initialize_session
from openai_config import openai
from datetime import datetime

chat_routes = Blueprint('chat_routes', __name__)

# Load and organize questions
dataset = load_dataset()
questions_by_category = organize_questions(dataset)

@chat_routes.route('/chat', methods=['GET'])
def initiate_chat():
    # Check if an existing session is valid
    if check_existing_session():
        if 'selected_questions' not in session:
            selected_questions = select_random_questions(questions_by_category)
            session['selected_questions'] = selected_questions
            session['current_question_index'] = 0

        selected_questions = session['selected_questions']
        current_index = session['current_question_index']
        total_questions = len(selected_questions)
        progress = 100 if total_questions == 0 else int((current_index / total_questions) * 100)
        next_question = selected_questions[current_index]['prompt']
        next_question_category = selected_questions[current_index]['category']

        # Ensure 'conversation_history' exists
        if 'conversation_history' not in session:
            session['conversation_history'] = []

        # Calculate remaining time
        expiry_time = datetime.fromisoformat(session['expiry_time'])
        remaining_time = max((expiry_time - datetime.utcnow()).total_seconds(), 0)

        # ✅ **Check if the last message is already the next_question**
        if not session['conversation_history'] or session['conversation_history'][-1]["content"] != next_question:
            session['conversation_history'].append({
                "role": "assistant",
                "category": next_question_category,
                "content": next_question
            })
            session.modified = True

        return jsonify({
            "message": "Restoring session.",
            "progress": progress,
            "next_question": next_question,
            "next_question_category": next_question_category,
            "conversation_history": session['conversation_history'],
            "remaining_time": remaining_time
        })

    # Initialize a new session if no valid session exists
    selected_questions = select_random_questions(questions_by_category)
    initialize_session(selected_questions)

    initial_question = selected_questions[0]['prompt']
    initial_question_category = selected_questions[0]['category']
    introduction_message = "Welcome to your personalized Computer Science interview practice session!"

    session['conversation_history'] = [
        {"role": "assistant", "content": introduction_message},
        {"role": "assistant", "category": initial_question_category, "content": initial_question}
    ]
    session.modified = True

    # Calculate remaining time for the new session
    expiry_time = datetime.fromisoformat(session['expiry_time'])
    remaining_time = max((expiry_time - datetime.utcnow()).total_seconds(), 0)

    return jsonify({
        "introduction": introduction_message,
        "initial_question": initial_question,
        "initial_question_category": initial_question_category,
        "progress": 0,
        "conversation_history": session['conversation_history'],
        "next_question": selected_questions[1]['prompt'] if len(selected_questions) > 1 else None,
        "remaining_time": remaining_time
    })



@chat_routes.route('/chat', methods=['POST'])
def get_chatbot_response():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "Missing message in request"}), 400

    if 'selected_questions' not in session:
        session['selected_questions'] = select_random_questions(questions_by_category)
        session['current_question_index'] = 0

    if 'conversation_history' not in session:
        session['conversation_history'] = []

    current_question_index = session['current_question_index']
    total_questions = len(session['selected_questions'])

    # If all questions are answered, provide the final message after user response
    if total_questions == 0 or current_question_index >= total_questions - 1:
        user_input = data.get('message', '').strip()
        if not user_input:
            return jsonify({"error": "No valid input provided"}), 400

        # Save user response to the last question
        session['conversation_history'].append({"role": "user", "content": user_input})

        # Process the last question (final chatbot response)
        current_question = session['selected_questions'][current_question_index]
        dataset_response = current_question['completion']

        try:
            conversation_history = session['conversation_history']
            messages = [
                {"role": "system", "content": "You are an AI interview coach. Respond assertively without asking follow-up questions. Just provide feedback based on the dataset."}
            ] + [{"role": msg["role"], "content": msg["content"]} for msg in conversation_history]

            openai_response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=150
            )
            chatbot_response = openai_response.choices[0].message.content.strip()
            full_response = f"{chatbot_response}  That's the end of the practice interview. Great job answering all the questions!"

            # Save bot response
            session['conversation_history'].append({"role": "assistant", "content": chatbot_response})

            # Save the final message
            session['conversation_history'].append({"role": "assistant", "content": full_response})

        except Exception as e:
            full_response = f"Error: {str(e)}"

            # Save error message
            session['conversation_history'].append({"role": "assistant", "content": full_response})

        # Prepare the final response and clear the session after sending it
        response = jsonify({
            "chatbot_response": full_response,
            "final_message": "Thank you and goodbye!",
            "progress": 100,
            "next_question": None,
            "conversation_history": session['conversation_history']
        })

        # Clear the session after sending the response
        session.clear()

        return response


    # For the normal question flow, handle the current question and progress
    user_input = data.get('message', '').strip()
    if not user_input:
        return jsonify({"error": "No valid input provided"}), 400

    # Save user response immediately in the conversation history
    session['conversation_history'].append({"role": "user", "content": user_input})

    # Process current question
    current_question = session['selected_questions'][current_question_index]
    dataset_response = current_question['completion']

    try:
        conversation_history = session['conversation_history']
        messages = [
            {"role": "system", "content": "You are an AI interview coach. Respond assertively without asking follow-up questions. Just provide feedback based on the dataset."}
        ] + [{"role": msg["role"], "content": msg["content"]} for msg in conversation_history]

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

    next_question = None
    next_question_category = None
    if current_question_index < total_questions:
        next_question = session['selected_questions'][current_question_index]['prompt']
        next_question_category = session['selected_questions'][current_question_index]['category']
        session['conversation_history'].append({"role": "assistant", "category": next_question_category, "content": next_question})
        session.modified = True

    return jsonify({
        "chatbot_response": full_response,
        "next_question_category": next_question_category,
        "next_question": next_question,
        "progress": progress,
        "conversation_history": session['conversation_history']
    })
