from flask import session
from datetime import datetime, timedelta

SESSION_DURATION_MINUTES = 5  # Set session duration to 40 minutes

def check_existing_session():
    """Check if a session already exists and is valid."""
    if 'user_session_id' in session and 'expiry_time' in session:
        expiry_time = datetime.fromisoformat(session['expiry_time'])
        if datetime.utcnow() < expiry_time:
            return True
    return False

def initialize_session(selected_questions):
    """Initialize a new session with a timer."""
    session['user_session_id'] = session.sid
    session['conversation_history'] = []
    session['selected_questions'] = selected_questions
    session['current_question_index'] = 0
    
    # Set the expiry time to 40 minutes from now
    expiry_time = datetime.utcnow() + timedelta(minutes=SESSION_DURATION_MINUTES)
    session['expiry_time'] = expiry_time.isoformat()
    session.modified = True

