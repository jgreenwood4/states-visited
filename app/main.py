"""Main routes: the map page and the JSON API the map talks to.

Every endpoint here is @login_required and scoped to `current_user`, so a user
can only ever read or change their own visited states — there is no code path
that returns another account's data.
"""

from flask import Blueprint, jsonify, render_template
from flask_login import current_user, login_required

from .extensions import db
from .models import VisitedState

main_bp = Blueprint("main", __name__)

# The 50 states plus DC, by FIPS code. We validate incoming codes against this
# set so a user can't create rows for arbitrary/garbage values.
VALID_FIPS = {
    "01", "02", "04", "05", "06", "08", "09", "10", "11", "12", "13", "15",
    "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27",
    "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
    "40", "41", "42", "44", "45", "46", "47", "48", "49", "50", "51", "53",
    "54", "55", "56",
}


@main_bp.route("/")
@login_required
def index():
    return render_template("index.html")


@main_bp.route("/api/visited", methods=["GET"])
@login_required
def get_visited():
    """Return the current user's visited states as { fips: iso-timestamp }."""
    rows = VisitedState.query.filter_by(user_id=current_user.id).all()
    visited = {row.fips: row.visited_at.isoformat() for row in rows}
    return jsonify({"visited": visited})


@main_bp.route("/api/visited/<fips>", methods=["POST"])
@login_required
def toggle_visited(fips):
    """Toggle one state for the current user; returns its new on/off state."""
    if fips not in VALID_FIPS:
        return jsonify({"error": "unknown state"}), 400

    row = VisitedState.query.filter_by(
        user_id=current_user.id, fips=fips
    ).first()

    if row is None:
        db.session.add(VisitedState(user_id=current_user.id, fips=fips))
        visited = True
    else:
        db.session.delete(row)
        visited = False

    db.session.commit()
    return jsonify({"fips": fips, "visited": visited})
