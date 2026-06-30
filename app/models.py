"""Database models.

An ORM (Object-Relational Mapper) lets us work with database rows as ordinary
Python objects instead of writing raw SQL. Each class below maps to a table, and
each instance maps to a row: reading `user.username` runs a SELECT for us, and
`db.session.add(user)` turns into an INSERT. SQLAlchemy is the ORM; it also keeps
us safe from SQL-injection by parameterising every query.
"""

from datetime import datetime

from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db


class User(UserMixin, db.Model):
    """A person with an account.

    UserMixin (from Flask-Login) gives this class the methods Flask-Login needs
    to track who is signed in — is_authenticated, get_id(), and so on — so we
    don't have to write them by hand.
    """

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)

    # We NEVER store the raw password. If the database ever leaked, plaintext
    # passwords would expose every account (and people reuse passwords across
    # sites). Instead we store a one-way hash: a value you can verify a password
    # against but can't reverse back into the original. Werkzeug salts each hash,
    # so identical passwords still produce different stored values.
    password_hash = db.Column(db.String(255), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # One user owns many visited-state rows. `backref` lets us go the other way
    # (visited_state.user); `cascade` deletes a user's rows if the user is deleted.
    states = db.relationship(
        "VisitedState",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan",
    )

    def set_password(self, password: str) -> None:
        """Hash and store a password (the plaintext is never saved)."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Return True if `password` matches the stored hash."""
        return check_password_hash(self.password_hash, password)

    def __repr__(self) -> str:
        return f"<User {self.username}>"


class VisitedState(db.Model):
    """One state a particular user has marked as visited.

    States are identified by their two-character FIPS code (e.g. "06" for
    California) to match the map data the front-end already uses.
    """

    __tablename__ = "visited_states"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    fips = db.Column(db.String(2), nullable=False)
    visited_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # A user can't visit the same state twice — one row per (user, state).
    __table_args__ = (
        db.UniqueConstraint("user_id", "fips", name="uq_user_state"),
    )

    def __repr__(self) -> str:
        return f"<VisitedState user={self.user_id} fips={self.fips}>"
