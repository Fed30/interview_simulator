import firebase_admin
from firebase_admin import credentials, firestore, db, auth,  storage
import os
import json

# Initialize Firebase Admin SDK with your service account
# Load Firebase credentials from environment variable
firebase_credentials = os.getenv("FIREBASE_CREDENTIALS")

if not firebase_credentials:
    raise ValueError("Missing FIREBASE_CREDENTIALS environment variable")

# Parse the JSON string into a Python dictionary
firebase_credentials_dict = json.loads(firebase_credentials)

cred = credentials.Certificate(firebase_credentials_dict)

firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://ai-simulator-8cb2e-default-rtdb.firebaseio.com',  # Realtime Database URL
    'projectId': 'ai-simulator-8cb2e',
    'storageBucket': 'ai-simulator-8cb2e.firebasestorage.app',
})

# Firestore reference
firestore_db = firestore.client()

# Initialize Realtime Database 
firebase_db = db.reference("/")  # Reference to the root of the Realtime Database

# Firebase Storage reference
storage_bucket = storage.bucket(name="ai-simulator-8cb2e.firebasestorage.app") 
