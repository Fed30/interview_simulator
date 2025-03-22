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



@app.route("/", methods=["GET"])
def home():
    return {"message": "Interview Simulator API is running!"}, 200

if __name__ == "__main__":
    app.run(debug=True)
