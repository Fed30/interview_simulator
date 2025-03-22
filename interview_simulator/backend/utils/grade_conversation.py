from firebase_config import firestore_db, firebase_db, storage_bucket
from utils.openai_get_feedback import get_feedback_summary_from_openai
from utils.openai_get_grade import get_grade_from_openai
import os
import json
import spacy
import csv
import io
import subprocess
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from textblob import TextBlob

def load_nlp_model():
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=True)
        return spacy.load("en_core_web_sm")

nlp = load_nlp_model()
CSV_FILE_PATH = "logs/grading_result.csv"
BIAS_LOG_FILE_PATH = "logs/bias_log.json"

def initialize_csv():
    blob = storage_bucket.blob(CSV_FILE_PATH)
    if not blob.exists():
        with io.StringIO() as f:
            csv.writer(f).writerow(["Question", "User Response", "Ideal Response", "Semantic Score", "Keyword Score", "Sentiment Match", "AI Score", "Rule Score", "Result"])
            blob.upload_from_string(f.getvalue(), content_type="text/csv")

initialize_csv()

def upload_to_firebase(blob_path, data, content_type="application/json"):
    try:
        storage_bucket.blob(blob_path).upload_from_string(data, content_type=content_type)
    except Exception as e:
        print(f"Error uploading to Firebase: {e}")

def log_to_csv(*row_data):
    try:
        blob = storage_bucket.blob(CSV_FILE_PATH)
        existing_data = blob.download_as_text() if blob.exists() else ""
        with io.StringIO(existing_data) as f:
            writer = csv.writer(f)
            writer.writerow(row_data)
            upload_to_firebase(CSV_FILE_PATH, f.getvalue(), "text/csv")
    except Exception as e:
        print(f"Error logging to CSV: {e}")

def log_bias(case):
    try:
        blob = storage_bucket.blob(BIAS_LOG_FILE_PATH)
        existing_data = json.loads(blob.download_as_text()) if blob.exists() else []
        existing_data.append(case)
        upload_to_firebase(BIAS_LOG_FILE_PATH, json.dumps(existing_data, indent=4))
    except Exception as e:
        print(f"Error logging bias: {e}")

def compute_scores(user_response, ideal_response):
    vectorizer = TfidfVectorizer().fit_transform([user_response, ideal_response])
    semantic_score = cosine_similarity(vectorizer)[0][1]
    user_keywords, ideal_keywords = set(nlp(user_response.lower()).ents), set(nlp(ideal_response.lower()).ents)
    keyword_score = len(user_keywords & ideal_keywords) / len(ideal_keywords) if ideal_keywords else 1
    sentiment_match = abs(TextBlob(user_response).sentiment.polarity - TextBlob(ideal_response).sentiment.polarity) < 0.2
    return semantic_score, keyword_score, sentiment_match

def validate_scores(ai_score, rule_score):
    try:
        return abs(float(ai_score) - float(rule_score)) >= 2
    except ValueError:
        return False

def grade_conversation(user_id, graded_conversation, dataset, doc_id, firebase_session_id):
    for i, msg in enumerate(graded_conversation):
        if msg.get('role') == 'user' and msg.get('content'):
            question = graded_conversation[i - 1].get('content') if i > 0 and graded_conversation[i - 1].get('role') == 'assistant' else "No question provided"
            ideal_response = next((item['user_answer'] for item in dataset if item['prompt'] == question), None)
            if not ideal_response:
                continue

            ai_grade = get_grade_from_openai(msg['content'], ideal_response, question)
            ai_feedback = get_feedback_summary_from_openai(msg['content'], ideal_response, question)
            semantic_score, keyword_score, sentiment_match = compute_scores(msg['content'], ideal_response)
            rule_based_score = 5 if semantic_score > 0.7 and keyword_score > 0.5 and sentiment_match else 2
            flagged = validate_scores(ai_grade, rule_based_score)

            # AI feedback consistency check
            feedback_sentiment = TextBlob(ai_feedback).sentiment.polarity
            grade_sentiment = 1 if ai_grade > 3 else -1  # Assume 4-5 is positive, 1-3 is negative
            feedback_inconsistent = (feedback_sentiment > 0 and ai_grade < 3) or (feedback_sentiment < 0 and ai_grade > 3)

            if flagged or feedback_inconsistent:
                log_bias({
                    "question": question,
                    "user_response": msg['content'],
                    "ideal_response": ideal_response,
                    "ai_score": ai_grade,
                    "rule_based_score": rule_based_score,
                    "semantic_score": semantic_score,
                    "keyword_score": keyword_score,
                    "sentiment_match": sentiment_match,
                    "ai_feedback": ai_feedback,
                    "feedback_sentiment": feedback_sentiment,
                    "grade_sentiment": grade_sentiment,
                    "issue": "AI feedback contradicts AI grade" if feedback_inconsistent else "Score discrepancy"
                })
                msg['flag'] = "FLAGGED_FEEDBACK" if feedback_inconsistent else "FLAGGED"

            msg.update({"grade": ai_grade, "feedback": ai_feedback})
            log_to_csv(question, msg['content'], ideal_response, semantic_score, keyword_score, "Match" if sentiment_match else "Mismatch", ai_grade, rule_based_score, "Pass" if not flagged and not feedback_inconsistent else "FLAGGED")
    
    try:
        firestore_db.collection("Sessions").document(doc_id).update({"history": graded_conversation})
        firebase_db.child(f'Users/{user_id}/Sessions/{firebase_session_id}').update({
            'session_link': f'https://firestore.googleapis.com/v1/projects/{os.getenv("FIREBASE_PROJECT_ID", "default_project_id")}/databases/(default)/documents/Sessions/{doc_id}'
        })
    except Exception as e:
        print(f"Error updating Firestore or Firebase DB: {e}")
    
    return graded_conversation
