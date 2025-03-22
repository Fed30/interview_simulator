import spacy
import subprocess
from flask import Flask
from flask_session import Session
from flask_cors import CORS
from app_config import configure_app
from routes import register_routes

# Initialize the Flask app
app = Flask(__name__)

# Configure app settings
configure_app(app)

# Initialize CORS before session to avoid conflicts
CORS(app, 
     supports_credentials=True, 
     resources={r"/*": {"origins": [
         "https://interview-simulator-nu.vercel.app",
         "https://interview-simulator-git-main-federicos-projects-6af4c6f1.vercel.app",
         "https://interview-simulator-lroniium7-federicos-projects-6af4c6f1.vercel.app",
     ]}},
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"]
)

# Initialize session after CORS
Session(app)

# Register routes
register_routes(app)

def download_spacy_model():
    try:
        # Check if the model is already installed
        try:
            spacy.load("en_core_web_sm")
        except OSError:
            print("spaCy model not found, downloading...")
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=True)
            print("spaCy model downloaded successfully.")
    except Exception as e:
        print(f"Error downloading spaCy model: {e}")
        raise e  # Re-raise the exception to stop further execution if download fails

# Call the function to ensure model is downloaded before starting the app
download_spacy_model()

@app.route("/", methods=["GET"])
def home():
    return {"message": "Interview Simulator API is running!"}, 200

if __name__ == "__main__":
    app.run(debug=True)
