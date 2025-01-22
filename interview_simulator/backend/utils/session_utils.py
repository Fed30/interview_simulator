from flask import session

def check_existing_session():
    """Check if a session already exists."""
    return 'user_session_id' in session

def initialize_session(selected_questions):
    """Initialize a new session."""
    session['user_session_id'] = session.sid
    session['conversation_history'] = []
    session['selected_questions'] = selected_questions
    session['current_question_index'] = 0
