import os
from datetime import timedelta
from dotenv import load_dotenv



# Add the config path to the system path
#sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend', 'config')))


from flask import Flask
from flask_session import Session
from flask_cors import CORS
#from config.app_config import configure_app
from routes import register_routes

# temporary
load_dotenv()

def configure_app(app):
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_PERMANENT'] = True
    app.config['SESSION_COOKIE_NAME'] = 'my_flask_session'
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'
    app.config['SESSION_COOKIE_SECURE'] = True
    app.secret_key = os.urandom(24)
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=40)  # 40 minutes


# Initialize the Flask app
app = Flask(__name__)

# Configure app settings
#configure_app(app)

# Initialize session and CORS
Session(app)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:3000"]}})


# Register routes
register_routes(app)

if __name__ == "__main__":
    app.run(port=5000,debug=True)
