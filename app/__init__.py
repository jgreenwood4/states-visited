"""Application factory.

`create_app()` builds and configures the Flask app. Using a factory (rather than
a module-level `app`) keeps things testable and lets tools like Flask-Migrate
import the extensions without triggering side effects.
"""

from flask import Flask

from config import Config
from .extensions import db, login_manager, migrate


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Attach each extension to this app instance.
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    # Flask-Login needs to know how to load a user from the id stored in the
    # session cookie. Imported here (not at module top) to avoid a circular
    # import with models, which import `db` from .extensions.
    from .models import User

    @login_manager.user_loader
    def load_user(user_id: str):
        return db.session.get(User, int(user_id))

    # Register the route groups (blueprints).
    from .auth import auth_bp
    from .main import main_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)

    return app
