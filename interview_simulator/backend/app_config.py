import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

def configure_app(app):
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_PERMANENT'] = True
    app.config['SESSION_COOKIE_NAME'] = 'my_flask_session'
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'
    app.config['SESSION_COOKIE_SECURE'] = True
    app.secret_key = os.urandom(24)
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=40)  # 40 minutes
