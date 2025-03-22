from firebase_config import firestore_db, firebase_db, storage_bucket
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
import io

# Load NLP model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Model 'en_core_web_sm' not found, attempting to download...")
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=True)
    nlp = spacy.load("en_core_web_sm")


# Firebase Storage paths for files
CSV_FILE_PATH = "logs/grading_result.csv"
BIAS_LOG_FILE_PATH = "logs/bias_log.json"

# Ensure CSV file exists in Firebase Storage and has a header
def initialize_csv_file():
    """Ensure the CSV file exists in Firebase Storage with headers."""
    try:
        csv_blob = storage_bucket.blob(CSV_FILE_PATH)
        
        # Check if the CSV file exists
        if not csv_blob.exists():
            # If the file doesn't exist, create a new CSV with headers
            with io.StringIO() as f:
                writer = csv.writer(f)
                writer.writerow(["Question","User Response", "Ideal Response", "Semantic Score", "Keyword Score", "Sentiment Match", "AI Score", "Rule Score", "Result"])
                f.seek(0)
                
                # Convert the content to bytes for uploading
                byte_data = io.BytesIO(f.getvalue().encode('utf-8'))
                csv_blob.upload_from_file(byte_data, content_type="text/csv")
            print(f"CSV file initialized: {CSV_FILE_PATH}")
    except Exception as e:
        print(f"Error initializing CSV file: {e}")

initialize_csv_file()


# Log grading results to Firebase Storage (CSV)
def log_to_csv(question, user_response, ideal_response, semantic_score, keyword_score, sentiment_match, ai_score, rule_score, result):
    """Logs all grading results to Firebase Storage (CSV)."""
    try:
        csv_blob = storage_bucket.blob(CSV_FILE_PATH)
        csv_data = io.StringIO()
        
        # If the CSV already exists, download its current data
        if csv_blob.exists():
            csv_blob.download_to_file(csv_data)
            csv_data.seek(0)
            reader = csv.reader(csv_data)
            rows = list(reader)
        else:
            rows = [["Question","User Response", "Ideal Response", "Semantic Score", "Keyword Score", "Sentiment Match", "AI Score", "Rule Score", "Result"]]

        # Add the new row with the data to be logged
        rows.append([question, user_response, ideal_response, semantic_score, keyword_score, sentiment_match, ai_score, rule_score, result])

        # Write all rows back to the CSV
        csv_data = io.StringIO()
        writer = csv.writer(csv_data)
        writer.writerows(rows)
        csv_data.seek(0)

        # Upload the string contents of CSV to Firebase Storage
        csv_blob.upload_from_string(csv_data.getvalue(), content_type="text/csv")
        print(f"Logged to CSV in Firebase Storage: {CSV_FILE_PATH}")
    except Exception as e:
        print(f"Error logging to Firebase Storage CSV: {e}")



# Log bias cases to Firebase Storage (JSON)
def log_bias(case):
    """Logs cases where AI feedback or scores seem inconsistent to Firebase Storage (JSON)."""
    try:
        bias_blob = storage_bucket.blob(BIAS_LOG_FILE_PATH)
        bias_data = io.StringIO()

        # If the bias log file exists, load its data
        if bias_blob.exists():
            bias_blob.download_to_file(bias_data)
            bias_data.seek(0)
            current_bias = json.load(bias_data)
        else:
            current_bias = []

        # Append the new case
        current_bias.append(case)

        # Convert the updated bias data into a JSON string
        json_data = json.dumps(current_bias, indent=4)

        # Upload the string data directly to Firebase Storage
        bias_blob.upload_from_string(json_data, content_type="application/json")
        print(f"Logged bias case to Firebase Storage: {BIAS_LOG_FILE_PATH}")
    except Exception as e:
        print(f"Error logging bias to Firebase Storage: {e}")



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
        ai_score = float(ai_score)  
        rule_based_score = float(rule_based_score)  

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

                        # Log into Firebase Storage
                        log_to_csv(question, user_response, ideal_response, semantic_score, keyword_score, sentiment_match_display, ai_grade, rule_based_score, result)

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
