import pandas as pd
import openpyxl 
import datetime
import json
import os
import io
import subprocess
import spacy
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from firebase_config import firestore_db, firebase_db, storage_bucket
from utils.openai_get_feedback import get_feedback_summary_from_openai
from utils.openai_get_grade import get_grade_from_openai

# Constants
EXCEL_FILE_PATH = "logs/grading_result.xlsx"
BIAS_LOG_FILE_PATH = "logs/bias_log.json"

def load_nlp_model():
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=True)
        return spacy.load("en_core_web_sm")

nlp = load_nlp_model()

def initialize_excel():
    blob = storage_bucket.blob(EXCEL_FILE_PATH)
    if not blob.exists():
        with io.BytesIO() as f:
            # Create a new dataframe with the required columns
            df = pd.DataFrame(columns=["question", "user_response", "ideal_response", "ai_score", "rule_based_score",
                                       "semantic_score", "keyword_score", "sentiment_match", "ai_feedback",
                                       "feedback_sentiment", "grade_sentiment", "issue"])
            
            # Write the dataframe to an in-memory BytesIO buffer
            with pd.ExcelWriter(f, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, sheet_name='Grading Results')
                
            # Upload the created Excel file to Firebase Storage
            f.seek(0)  # Rewind the buffer before uploading
            blob.upload_from_string(f.getvalue(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        
        print("Excel file initialized successfully.")
        
initialize_excel()

def upload_to_firebase(blob_path, data, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"):
    try:
        storage_bucket.blob(blob_path).upload_from_string(data, content_type=content_type)
    except Exception as e:
        print(f"Error uploading to Firebase: {e}")

def compute_scores(user_response, ideal_response, context):
    # Fine-tune semantic score with adjusted vectorizer
    vectorizer = TfidfVectorizer(sublinear_tf=True, max_features=1000).fit_transform([user_response, ideal_response])
    semantic_score = cosine_similarity(vectorizer)[0][1]

    # Synonym-based keyword matching (You can add a dictionary or use WordNet for synonyms)
    user_keywords = set(nlp(user_response.lower()).ents)
    ideal_keywords = set(nlp(ideal_response.lower()).ents)
    
    # Contextualized matching (optional): Enhance matching with additional context or domain-specific rules
    if context:
        user_keywords = user_keywords.union(set(nlp(context).ents))
        ideal_keywords = ideal_keywords.union(set(nlp(context).ents))

    # Use set intersection to compare relevant keywords
    keyword_score = len(user_keywords & ideal_keywords) / len(ideal_keywords) if ideal_keywords else 1

    # Improved sentiment matching by incorporating sentiment polarity and subjectivity
    sentiment_diff = abs(TextBlob(user_response).sentiment.polarity - TextBlob(ideal_response).sentiment.polarity)
    sentiment_subjectivity_diff = abs(TextBlob(user_response).sentiment.subjectivity - TextBlob(ideal_response).sentiment.subjectivity)

    # Make sentiment threshold dynamic based on response context (e.g., more tolerance for complex statements)
    sentiment_match = sentiment_diff < 0.3 and sentiment_subjectivity_diff < 0.2

    # Penalty for responses that are too short or lack depth (can be adjusted based on your needs)
    if len(user_response.split()) < 5:
        semantic_score *= 0.8  # Apply penalty for short responses

    return semantic_score, keyword_score, sentiment_match


def validate_scores(ai_score, rule_score):
    try:
        return abs(float(ai_score or 0) - float(rule_score or 0)) >= 3
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

def compute_rule_based_score(semantic_score, keyword_score, sentiment_match):
    if semantic_score > 0.8 and keyword_score >= 0.8 and sentiment_match:
        return 10
    elif semantic_score > 0.7 and keyword_score >= 0.6:
        return 9
    elif semantic_score > 0.6:
        return 8
    elif semantic_score > 0.5:
        return 7
    elif semantic_score > 0.4:
        return 6
    elif semantic_score > 0.3:
        return 5
    elif semantic_score > 0.2:
        return 4
    elif semantic_score > 0.1:
        return 3
    else:
        return 2


def log_to_excel(rows):
    try:
        # Reference to the existing Excel file in Firebase Storage
        blob = storage_bucket.blob(EXCEL_FILE_PATH)
        existing_data = blob.download_as_bytes() if blob.exists() else b""
        
        # Load the existing Excel file from the blob data
        with io.BytesIO(existing_data) as f:
            if existing_data:  # Check if there's existing data in the file
                # Load the Excel file into pandas
                df = pd.read_excel(f, sheet_name='Grading Results')
            else:
                # If no existing data, create a new DataFrame with columns
                df = pd.DataFrame(columns=["question", "user_response", "ideal_response", "ai_score", 
                                           "rule_based_score", "semantic_score", "keyword_score", 
                                           "sentiment_match", "ai_feedback", "feedback_sentiment", 
                                           "grade_sentiment", "issue"])

            # Append the new rows to the existing dataframe
            new_rows_df = pd.DataFrame(rows, columns=df.columns)
            df = pd.concat([df, new_rows_df], ignore_index=True)
            
            # Create an in-memory BytesIO buffer to save the updated Excel file
            with io.BytesIO() as output:
                # Write the updated dataframe to the buffer
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    df.to_excel(writer, index=False, sheet_name='Grading Results')
                output.seek(0)  # Rewind the buffer before uploading
                
                # Upload the updated Excel file back to Firebase Storage
                blob.upload_from_file(output, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                
        print("Excel updated successfully.")
    except Exception as e:
        print(f"Error logging to Excel: {e}")

def grade_conversation(user_id, graded_conversation, dataset, doc_id, firebase_session_id, callback=None):
    updates = []
    excel_rows = []
    ideal_responses = {item['prompt']: item['user_answer'] for item in dataset}

    for i, msg in enumerate(graded_conversation):
        if msg.get('role') == 'assistant':  
            updates.append(msg)
            continue
        
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
        context= "Computer Science Interview"
        semantic_score, keyword_score, sentiment_match = compute_scores(user_content, ideal_response, context)
        rule_based_score = compute_rule_based_score(semantic_score, keyword_score, sentiment_match)
        flagged = validate_scores(ai_grade, rule_based_score)

        feedback_sentiment = round(TextBlob(ai_feedback).sentiment.polarity, 1) if len(ai_feedback.split()) > 3 else 0.0
        grade_sentiment = 1 if int(ai_grade) > 3 else -1
        feedback_inconsistent = (feedback_sentiment > 0 and int(ai_grade) < 3) or (feedback_sentiment < 0 and int(ai_grade) > 3)
        feedback_inconsistent = False if abs(feedback_sentiment) < 0.2 else feedback_inconsistent

        issue = None
        if flagged and feedback_inconsistent:
            issue = "AI feedback contradicts AI grade"
            msg['flag'] = "FLAGGED_FEEDBACK"
        elif flagged:
            issue = "Score discrepancy"
            msg['flag'] = "FLAGGED_GRADE"

        if issue:
            log_bias({"question": question, "user_response": user_content, "ideal_response": ideal_response,
                      "ai_score": ai_grade, "rule_based_score": rule_based_score, "semantic_score": semantic_score,
                      "keyword_score": keyword_score, "sentiment_match": sentiment_match, "ai_feedback": ai_feedback,
                      "feedback_sentiment": feedback_sentiment, "grade_sentiment": grade_sentiment, "issue": issue})
        
        msg['grade'] = ai_grade
        msg['feedback'] = ai_feedback
        updates.append(msg)
        excel_rows.append([question, user_content, ideal_response, ai_grade, rule_based_score,
                         semantic_score, keyword_score, sentiment_match, ai_feedback,
                         feedback_sentiment, grade_sentiment, issue or "Pass"])
    
    try:
        firestore_db.collection("Sessions").document(doc_id).update({"history": updates})
        firebase_db.child(f'Users/{user_id}/Sessions/{firebase_session_id}').update({'session_link': f'https://firestore.googleapis.com/v1/projects/{os.getenv("FIREBASE_PROJECT_ID", "default_project_id")}/databases/(default)/documents/Sessions/{doc_id}'})
        if excel_rows:
            log_to_excel(excel_rows)
        if callback:
            callback(user_id, graded_conversation, datetime.datetime.now().strftime("%d-%m-%Y %H:%M:%S"), "Completed", doc_id, firebase_session_id)
    except Exception as e:
        print(f"Error updating Firestore or Firebase DB: {e}")
    
    return updates
