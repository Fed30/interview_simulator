import firebase_admin
from firebase_admin import credentials, firestore, db, auth,  storage
import os

# Initialize Firebase Admin SDK with your service account
cred = credentials.Certificate(os.getenv("FIREBASE_CREDENTIALS"))
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
