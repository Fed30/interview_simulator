from firebase_config import firestore_db, firebase_db
from utils.openai_get_feedback import get_feedback_summary_from_openai
from utils.openai_get_grade import get_grade_from_openai
import os
import json
import spacy
import csv
import subprocess
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from textblob import TextBlob

# Get the base directory of the project (i.e., "interview_simulator\backend")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Construct the full paths to the JSON and CSV files
BIAS_LOG_FILE = os.path.join(BASE_DIR, "bias_log.json")
CSV_FILE = os.path.join(BASE_DIR, "grading_result.csv")

# Load NLP model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Model 'en_core_web_sm' not found, attempting to download...")
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=True)
    nlp = spacy.load("en_core_web_sm")
    
    


# Ensure CSV file exists and has a header
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["User Response", "Ideal Response", "Semantic Score", "Keyword Score", "Sentiment Match", "AI Score", "Rule Score", "Result"])

def log_to_csv(user_response, ideal_response, semantic_score, keyword_score, sentiment_match, ai_score, rule_score, result):
    """Logs all grading results to a CSV file."""
    try:
        with open(CSV_FILE, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([user_response, ideal_response, semantic_score, keyword_score, sentiment_match, ai_score, rule_score, result])
        print(f"Logged to CSV: {CSV_FILE}")
    except Exception as e:
        print(f"Error logging to CSV: {e}")

def log_bias(case):
    """Logs cases where AI feedback or scores seem inconsistent."""
    try:
        with open(BIAS_LOG_FILE, "a") as f:
            f.write(json.dumps(case) + "\n")
        print(f"Logged bias case to {BIAS_LOG_FILE}")
    except Exception as e:
        print(f"Error logging bias: {e}")

def keyword_match_score(user_response, ideal_response):
    """
    Computes keyword match score based on the number of shared words.
    """
    user_keywords = set(nlp(user_response.lower()).ents)  # Extract named entities
    ideal_keywords = set(nlp(ideal_response.lower()).ents)

    if not ideal_keywords:
        return 1 if user_keywords else 0  # If no keywords exist in the ideal response, return neutral score

    return len(user_keywords.intersection(ideal_keywords)) / len(ideal_keywords)

def semantic_similarity(user_response, ideal_response):
    """
    Computes the semantic similarity between user and ideal responses using TF-IDF and cosine similarity.
    """
    vectorizer = TfidfVectorizer().fit_transform([user_response, ideal_response])
    vectors = vectorizer.toarray()
    return cosine_similarity([vectors[0]], [vectors[1]])[0][0]

def sentiment_match(user_response, ideal_response):
    """
    Ensures that the sentiment of the user’s response is similar to the ideal response.
    """
    user_sentiment = TextBlob(user_response).sentiment.polarity
    ideal_sentiment = TextBlob(ideal_response).sentiment.polarity

    return abs(user_sentiment - ideal_sentiment) < 0.2  # Allow some variation

def validate_ai_score(ai_score, rule_based_score):
    """
    Validates AI-generated score against rule-based score.
    Flags cases where the AI score deviates significantly.
    """
    try:
        # Ensure both scores are numbers (either int or float)
        ai_score = float(ai_score)  # Convert to float
        rule_based_score = float(rule_based_score)  # Convert to float

        return abs(ai_score - rule_based_score) >= 2  # Flag if the scores differ by 2 or more
    except (ValueError, TypeError) as e:
        print(f"Error validating AI score: {e}")
        return False  # If there was an error in conversion, do not flag it

def grade_conversation(user_id, graded_conversation, dataset, doc_id, firebase_session_id):
    for i, msg in enumerate(graded_conversation):
        if msg.get('role') == 'user':  # Grade only user responses
            user_response = msg.get('content')
            if user_response:
                question = (
                    graded_conversation[i - 1].get('content')
                    if i > 0 and graded_conversation[i - 1].get('role') == 'assistant'
                    else "No question provided"
                )

                # Get the ideal response from the dataset
                ideal_response = next(
                    (item['user_answer'] for item in dataset if item['prompt'] == question), None
                )

                if ideal_response:
                    try:
                        # Fetch AI-generated grade and feedback
                        ai_grade = get_grade_from_openai(user_response, ideal_response, question)
                        ai_feedback = get_feedback_summary_from_openai(user_response, ideal_response, question)

                        # Ensure ai_grade is a valid number
                        ai_grade = float(ai_grade) if isinstance(ai_grade, (int, float)) else 0  # Default to 0 if invalid

                        # NLP-based rule-based grading
                        keyword_score = keyword_match_score(user_response, ideal_response)
                        semantic_score = semantic_similarity(user_response, ideal_response)
                        sentiment_match_result = sentiment_match(user_response, ideal_response)

                        rule_based_score = 5 if semantic_score > 0.7 and keyword_score > 0.5 and sentiment_match_result else 2

                        # Validate AI grading
                        if validate_ai_score(ai_grade, rule_based_score):
                            log_bias({
                                "question": question,
                                "user_response": user_response,
                                "ideal_response": ideal_response,
                                "ai_score": ai_grade,
                                "rule_based_score": rule_based_score,
                                "semantic_score": semantic_score,
                                "keyword_score": keyword_score,
                                "sentiment_match": sentiment_match_result
                            })
                            msg['flag'] = "FLAGGED"  # Mark as flagged for review
                            msg['grade'] = ai_grade
                        else:
                            msg['grade'] = ai_grade

                        msg['feedback'] = ai_feedback
                        
                        # Determine pass/fail
                        result = "Pass" if not validate_ai_score(ai_grade, rule_based_score) else "FLAGGED"

                        # Convert sentiment match to readable format
                        sentiment_match_display = "Match" if sentiment_match_result else "Mismatch"

                        # Log into CSV
                        log_to_csv(user_response, ideal_response, semantic_score, keyword_score, sentiment_match_display, ai_grade, rule_based_score, result)


                    except Exception as e:
                        print(f"Error grading message {i}: {e}")
                        msg['grade'] = 'Error'
                        msg['feedback'] = 'Error in grading/feedback'

    # Update Firestore with graded conversation
    try:
        doc_ref = firestore_db.collection("Sessions").document(doc_id)
        doc_ref.update({"history": graded_conversation})
        doc_ref_id = doc_ref.id
    except Exception as e:
        print(f"Error updating Firestore: {e}")
        return None

    # Update Firebase Realtime Database
    project_id = os.getenv('FIREBASE_PROJECT_ID', 'default_project_id')
    session_data = {'session_link': f'https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/Sessions/{doc_ref_id}'}

    try:
        firebase_db.child(f'Users/{user_id}/Sessions/{firebase_session_id}').update(session_data)
    except Exception as e:
        print(f"Error updating Firebase Realtime Database: {e}")
        return None

    return graded_conversation
