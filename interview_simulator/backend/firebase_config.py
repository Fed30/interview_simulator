import firebase_admin
from firebase_admin import credentials, firestore, db, auth, storage
import os

# Path to the Firebase credentials file stored in Render
firebase_credentials_path = "/etc/secrets/firebase_credentials.json"

if not os.path.exists(firebase_credentials_path):
    raise ValueError("Firebase credentials file not found!")

# Initialize Firebase Admin SDK
cred = credentials.Certificate(firebase_credentials_path)

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
