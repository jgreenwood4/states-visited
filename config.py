"""Application configuration.

Everything that changes between your laptop and a real server (the database
location, secret keys, the port) is read from environment variables here, so the
same code runs everywhere without edits.
"""

import os


# The folder this file lives in. Used to place the local SQLite file somewhere
# predictable when DATABASE_URL isn't set.
BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def _database_url() -> str:
    """Return the SQLAlchemy database URL.

    In production we set DATABASE_URL to a PostgreSQL connection string. When it
    is missing (i.e. local development) we fall back to a SQLite file sitting in
    the project folder, so you can run the app without installing Postgres.
    """
    url = os.environ.get("DATABASE_URL")
    if not url:
        # SQLite needs no server: the whole database is a single file on disk.
        return "sqlite:///" + os.path.join(BASE_DIR, "states.db")

    # Many hosts (Heroku, Render, Railway, …) hand out URLs that start with
    # "postgres://", but SQLAlchemy's driver wants "postgresql://". Normalise it
    # so the same URL works either way.
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


class Config:
    # Flask signs the session cookie (which keeps you logged in) with this key.
    # Set a real, random SECRET_KEY in production; the default is dev-only.
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")

    SQLALCHEMY_DATABASE_URI = _database_url()

    # Turns off a noisy feature we don't use; recommended by Flask-SQLAlchemy.
    SQLALCHEMY_TRACK_MODIFICATIONS = False
