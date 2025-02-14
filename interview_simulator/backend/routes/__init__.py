from .chat_routes import chat_routes
from .save_conversation import save_conversation
from .token_verification import token_verification
from .edit_profile import edit_profile
from .insight_panel_routes import insight_panel_data
from .analytics_routes import analytics_panel_data
from .feedback_routes import feedback_data


def register_routes(app):
    app.register_blueprint(chat_routes)
    app.register_blueprint(save_conversation)
    app.register_blueprint(token_verification)
    app.register_blueprint(edit_profile)
    app.register_blueprint(insight_panel_data)
    app.register_blueprint(analytics_panel_data)
    app.register_blueprint(feedback_data)
    
