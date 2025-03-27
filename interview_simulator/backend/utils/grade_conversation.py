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

CSV_FILE_PATH = "logs/grading_result.csv"
BIAS_LOG_FILE_PATH = "logs/bias_log.json"

def load_nlp_model():
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=True)
        return spacy.load("en_core_web_sm")

nlp = load_nlp_model()

def initialize_csv():
    blob = storage_bucket.blob(CSV_FILE_PATH)
    if not blob.exists():
        with io.StringIO() as f:
            writer = csv.writer(f)
            writer.writerow(["question", "user_response", "ideal_response", "ai_score", "rule_based_score",
                             "semantic_score", "keyword_score", "sentiment_match", "ai_feedback",
                             "feedback_sentiment", "grade_sentiment", "issue"])
            blob.upload_from_string(f.getvalue(), content_type="text/csv")

initialize_csv()

def upload_to_firebase(blob_path, data, content_type="application/json"):
    try:
        storage_bucket.blob(blob_path).upload_from_string(data, content_type=content_type)
    except Exception as e:
        print(f"Error uploading to Firebase: {e}")

def compute_scores(user_response, ideal_response):
    vectorizer = TfidfVectorizer().fit_transform([user_response, ideal_response])
    semantic_score = cosine_similarity(vectorizer)[0][1]
    
    user_keywords = set(nlp(user_response.lower()).ents)
    ideal_keywords = set(nlp(ideal_response.lower()).ents)
    keyword_score = len(user_keywords & ideal_keywords) / len(ideal_keywords) if ideal_keywords else 1
    
    sentiment_diff = abs(TextBlob(user_response).sentiment.polarity - TextBlob(ideal_response).sentiment.polarity)
    sentiment_match = sentiment_diff < 0.2
    
    return semantic_score, keyword_score, sentiment_match

def validate_scores(ai_score, rule_score):
    try:
        return abs(float(ai_score or 0) - float(rule_score or 0)) >= 2
    except ValueError:
        return False

def log_bias(case):
    try:
        blob = storage_bucket.blob(BIAS_LOG_FILE_PATH)
        existing_data = json.loads(blob.download_as_text()) if blob.exists() else []
        existing_data.append(case)
        upload_to_firebase(BIAS_LOG_FILE_PATH, json.dumps(existing_data, indent=4))
    except Exception as e:
        print(f"Error logging bias: {e}")

def log_to_csv(rows):
    try:
        blob = storage_bucket.blob(CSV_FILE_PATH)
        existing_data = blob.download_as_text() if blob.exists() else ""
        existing_rows = existing_data.strip().split("\n") if existing_data else []

        rows = [
            [str(item) if item is not None else "N/A" for item in row] for row in rows
        ]
        
        updated_rows = existing_rows + [",".join(row) for row in rows]
        
        output = io.StringIO()
        csv_writer = csv.writer(output, quoting=csv.QUOTE_ALL)

        if not existing_data:
            csv_writer.writerow(["question", "user_response", "ideal_response", "ai_score", "rule_based_score",
                                 "semantic_score", "keyword_score", "sentiment_match", "ai_feedback",
                                 "feedback_sentiment", "grade_sentiment", "issue"])
        
        for row in rows:
            csv_writer.writerow(row)

        updated_csv_content = output.getvalue()
        upload_to_firebase(CSV_FILE_PATH, updated_csv_content, "text/csv")
        print("CSV updated successfully.")
    except Exception as e:
        print(f"Error logging to CSV: {e}")

def grade_conversation(user_id, graded_conversation, dataset, doc_id, firebase_session_id):
    updates = []  # Store updates for Firestore
    csv_rows = []  # Store data for CSV logging

    ideal_responses = {item['prompt']: item['user_answer'] for item in dataset}  # Map prompts to ideal responses

    for i, msg in enumerate(graded_conversation):
        if msg.get('role') != 'user' or not msg.get('content'):
            continue
        
        question = (graded_conversation[i - 1].get('content', "No question provided") 
                    if i > 0 and graded_conversation[i - 1].get('role') == 'assistant' else "No question provided")
        
        ideal_response = ideal_responses.get(question, "N/A")
        if not ideal_response:
            continue

        user_content = msg['content']
        ai_grade = get_grade_from_openai(user_content, ideal_response, question)
        ai_feedback = get_feedback_summary_from_openai(user_content, ideal_response, question)

        semantic_score, keyword_score, sentiment_match = compute_scores(user_content, ideal_response)
        rule_based_score = 5 if semantic_score > 0.8 else 4 if semantic_score > 0.6 else 3 if semantic_score > 0.4 else 2
        flagged = validate_scores(ai_grade, rule_based_score)

        feedback_sentiment = round(TextBlob(ai_feedback).sentiment.polarity, 1) if len(ai_feedback.split()) > 3 else 0.0
        grade_sentiment = 1 if int(ai_grade) > 3 else -1
        feedback_inconsistent = (feedback_sentiment > 0 and int(ai_grade) < 3) or (feedback_sentiment < 0 and int(ai_grade) > 3)

        if abs(feedback_sentiment) < 0.2:
            feedback_inconsistent = False  # Ignore neutral feedback

        issue = None
        if flagged and feedback_inconsistent:
            issue = "AI feedback contradicts AI grade"
            msg['flag'] = "FLAGGED_FEEDBACK"
        elif flagged:
            issue = "Score discrepancy"
            msg['flag'] = "FLAGGED_GRADE"

        if issue:
            log_bias({
                "question": question,
                "user_response": user_content,
                "ideal_response": ideal_response,
                "ai_score": ai_grade,
                "rule_based_score": rule_based_score,
                "semantic_score": semantic_score,
                "keyword_score": keyword_score,
                "sentiment_match": sentiment_match,
                "ai_feedback": ai_feedback,
                "feedback_sentiment": feedback_sentiment,
                "grade_sentiment": grade_sentiment,
                "issue": issue
            })

        msg['grade'] = ai_grade
        msg['feedback'] = ai_feedback
        updates.append(msg)

        csv_rows.append([question, user_content, ideal_response, ai_grade, rule_based_score,
                         semantic_score, keyword_score, sentiment_match, ai_feedback,
                         feedback_sentiment, grade_sentiment, issue or "N/A"])

    try:
        # Batch update Firestore
        firestore_db.collection("Sessions").document(doc_id).update({"history": updates})

        # Update Firebase Realtime Database
        firebase_db.child(f'Users/{user_id}/Sessions/{firebase_session_id}').update({
            'session_link': f'https://firestore.googleapis.com/v1/projects/{os.getenv("FIREBASE_PROJECT_ID", "default_project_id")}/databases/(default)/documents/Sessions/{doc_id}'
        })

        # Log all CSV entries in a single operation
        if csv_rows:
            log_to_csv(csv_rows)

    except Exception as e:
        print(f"Error updating Firestore or Firebase DB: {e}")

    return updates
