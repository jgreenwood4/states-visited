"""Shared Flask extension instances.

These objects are created here without an app attached, then wired to the app
inside create_app() (the "application factory" pattern). Keeping them in their
own module avoids circular imports between the factory and the models.
"""

from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# The ORM. `db.Model` is the base class every model inherits from.
db = SQLAlchemy()

# A migration is a recorded, ordered change to the database's structure — "add a
# users table", "add a column", etc. Flask-Migrate (built on Alembic) compares
# your models to the live database and generates these change-scripts, so the
# schema can evolve over time and every environment can be brought up to date by
# replaying them in order, instead of hand-editing tables.
migrate = Migrate()

# Manages the logged-in session: which user a request belongs to, and redirects
# anonymous visitors to the login page for @login_required views.
login_manager = LoginManager()
login_manager.login_view = "auth.login"
login_manager.login_message_category = "error"
