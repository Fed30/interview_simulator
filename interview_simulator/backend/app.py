import sys
import os

# Add the 'config' folder to the system path
#sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'config')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend', 'config')))

from flask import Flask
from flask_session import Session
from flask_cors import CORS
from config.app_config import configure_app
from routes import register_routes

# Initialize the Flask app
app = Flask(__name__)

# Configure app settings
configure_app(app)

# Initialize session and CORS
Session(app)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:3000"]}})


# Register routes
register_routes(app)

if __name__ == "__main__":
    app.run(port=5000,debug=True)
