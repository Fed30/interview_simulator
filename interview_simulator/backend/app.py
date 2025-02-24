from flask import Flask
from flask_session import Session
from flask_cors import CORS
from app_config import configure_app
from routes import register_routes

# Initialize the Flask app
app = Flask(__name__)

# Configure app settings
configure_app(app)

# Initialize session and CORS
Session(app)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["https://interview-simulator-ruddy.vercel.app/","https://interview-simulator-git-main-federicos-projects-6af4c6f1.vercel.app/","https://interview-simulator-b9lpvvn3n-federicos-projects-6af4c6f1.vercel.app/"]}})


# Register routes
register_routes(app)

@app.route("/", methods=["GET"])
def home():
    return {"message": "Interview Simulator API is running!"}, 200

if __name__ == "__main__":
    app.run(port=5000,debug=True)
