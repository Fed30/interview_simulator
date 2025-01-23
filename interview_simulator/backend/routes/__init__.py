from .chat_routes import chat_routes
from .save_conversation import save_conversation
from .token_verification import token_verification
from .edit_profile import edit_profile

def register_routes(app):
    app.register_blueprint(chat_routes)
    app.register_blueprint(save_conversation)
    app.register_blueprint(token_verification)
    app.register_blueprint(edit_profile)
    
