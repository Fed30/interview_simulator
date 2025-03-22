import json
import spacy
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load NLP model
nlp = spacy.load("en_core_web_sm")

# Log file for inconsistencies
FEEDBACK_LOG_FILE = "feedback_consistency_log.json"

# Store previous feedback for comparison
feedback_memory = {}


def normalize_text(text):
    """Converts text to lowercase, removes extra spaces, and lemmatizes it."""
    doc = nlp(text.lower().strip())
    return " ".join([token.lemma_ for token in doc if not token.is_punct and not token.is_stop])


def check_feedback_consistency(user_response, ai_feedback):
    """
    Compares AI feedback for similar inputs to ensure consistency.
    If similar responses get significantly different feedback, logs them.
    """
    global feedback_memory

    # Normalize user response
    normalized_response = normalize_text(user_response)

    # Store the first occurrence of a normalized response
    if normalized_response not in feedback_memory:
        feedback_memory[normalized_response] = ai_feedback
        return True  # First-time feedback, assume correct

    # Compare new feedback with previous feedback for similar response
    prev_feedback = feedback_memory[normalized_response]

    vectorizer = TfidfVectorizer().fit_transform([prev_feedback, ai_feedback])
    similarity_score = cosine_similarity(vectorizer)[0][1]

    # If feedback similarity is too low for the same input, flag it
    if similarity_score < 0.7:  # Adjust threshold as needed
        log_feedback_inconsistency(normalized_response, prev_feedback, ai_feedback)
        return False  # Flag as inconsistent

    return True  # Feedback is consistent


def log_feedback_inconsistency(user_response, prev_feedback, new_feedback):
    """Logs inconsistent feedback cases for manual review."""
    try:
        log_entry = {
            "user_response": user_response,
            "previous_feedback": prev_feedback,
            "new_feedback": new_feedback
        }

        with open(FEEDBACK_LOG_FILE, "a") as f:
            f.write(json.dumps(log_entry) + "\n")

        print(f"Logged inconsistent feedback: {FEEDBACK_LOG_FILE}")

    except Exception as e:
        print(f"Error logging feedback inconsistency: {e}")
