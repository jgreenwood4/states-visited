"""Authentication routes: sign up, log in, log out."""

from flask import (
    Blueprint,
    flash,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required, login_user, logout_user

from .extensions import db
from .models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    # Already signed in? Skip straight to the map.
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""

        # Basic validation. Keep messages friendly but vague enough not to leak
        # which usernames exist.
        if not username or not password:
            flash("Please choose a username and password.", "error")
        elif len(password) < 8:
            flash("Password must be at least 8 characters.", "error")
        elif User.query.filter_by(username=username).first():
            flash("That username is taken — try another.", "error")
        else:
            user = User(username=username)
            user.set_password(password)  # hashes the password before storing
            db.session.add(user)
            db.session.commit()
            login_user(user)  # log the new account straight in
            return redirect(url_for("main.index"))

    return render_template("signup.html")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""

        user = User.query.filter_by(username=username).first()

        # Verify against the stored hash. We give the same generic message
        # whether the username or the password was wrong, so an attacker can't
        # tell which usernames are registered.
        if user is None or not user.check_password(password):
            flash("Incorrect username or password.", "error")
        else:
            login_user(user, remember=bool(request.form.get("remember")))
            # Respect ?next= so @login_required redirects land where intended.
            next_url = request.args.get("next")
            return redirect(next_url or url_for("main.index"))

    return render_template("login.html")


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login"))
