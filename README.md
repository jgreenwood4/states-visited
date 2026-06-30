# Fifty

An interactive map that tracks **which of the fifty United States you've visited** — set over full-bleed, slowly drifting photography of iconic American landmarks.

Sign up, log in, and tap a state to light it up. Each account has its own private map, stored in a database on the server.

## What this is

A small **Flask** web app with user accounts:

- **Sign up / log in / log out** with sessions managed by [Flask-Login](https://flask-login.readthedocs.io/).
- Passwords are **hashed with Werkzeug** before they ever touch the database — the plaintext is never stored.
- A logged-in user toggles states on the map; **every user only ever sees their own map and visited states**.
- Data lives in **PostgreSQL** in production, accessed through the **SQLAlchemy** ORM, with schema changes managed by **Flask-Migrate**.
- For local development it **falls back to a SQLite file** automatically, so you don't need to install Postgres.

### A few terms, briefly

- **ORM (Object-Relational Mapper)** — lets us treat database rows as ordinary Python objects (a `User`, a `VisitedState`) instead of writing raw SQL. SQLAlchemy generates the SQL for us and guards against SQL-injection. See [`app/models.py`](app/models.py).
- **Migration** — a recorded, ordered change to the database's *structure* ("create the users table", "add a column"). Flask-Migrate compares the models to the live database and writes these change-scripts, so the schema can evolve and every environment is brought up to date by replaying them. Files live in [`migrations/`](migrations/).
- **Why we hash passwords** — a hash is a one-way fingerprint: you can check a password against it but can't reverse it back into the original. If the database ever leaked, hashed passwords stay useless to an attacker (and people reuse passwords across sites). Werkzeug also *salts* each hash, so two users with the same password still get different stored values.

## Run locally

Requires Python 3.10+. No database server needed — it uses a local SQLite file.

```bash
cd states-visited

# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create the database tables from the migrations
export FLASK_APP=wsgi.py
flask db upgrade

# 4. Run it
python wsgi.py                      # http://localhost:5000
```

Then open <http://localhost:5000>, create an account, and start tapping states.

### Configuration (environment variables)

All optional for local development — sensible defaults are built in. Copy [`.env.example`](.env.example) to `.env` to set your own.

| Variable       | Default                       | Purpose                                                        |
| -------------- | ----------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL` | local SQLite file `states.db` | Database connection string. Set to a `postgresql://…` URL in production. |
| `SECRET_KEY`   | `dev-secret-change-me`        | Signs the login session cookie. **Set a real random value in production.** |
| `PORT`         | `5000`                        | Port the server listens on.                                    |

> `DATABASE_URL` values that start with `postgres://` (as some hosts hand out) are normalised to `postgresql://` automatically.

## Database migrations

The first migration (which creates the `users` and `visited_states` tables) is already committed under [`migrations/`](migrations/). Day-to-day:

```bash
export FLASK_APP=wsgi.py

flask db upgrade                       # apply pending migrations (run after pulling)
flask db migrate -m "describe change"  # auto-generate a migration after editing models
flask db downgrade                     # roll back the last migration
```

After changing a model in [`app/models.py`](app/models.py), run `flask db migrate` to generate a migration, review the generated file, then `flask db upgrade` to apply it.

## Deploy

Run under a production WSGI server (gunicorn is included) and point `DATABASE_URL` at a PostgreSQL instance:

```bash
export DATABASE_URL=postgresql://user:password@host:5432/fifty
export SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
flask db upgrade                       # bring the schema up to date
gunicorn wsgi:app --bind 0.0.0.0:$PORT
```

Most platforms (Render, Railway, Fly.io, Heroku, …) set `DATABASE_URL` and `PORT` for you; just add `SECRET_KEY` and run `flask db upgrade` on deploy.

## Project layout

```
wsgi.py              entry point — `gunicorn wsgi:app`, or `python wsgi.py` for dev (reads PORT)
config.py            configuration from env vars (DATABASE_URL with SQLite fallback, SECRET_KEY)
requirements.txt     flask, flask-sqlalchemy, flask-migrate, flask-login, gunicorn, psycopg2-binary
app/
  __init__.py        application factory — wires extensions and blueprints
  extensions.py      shared SQLAlchemy / Migrate / LoginManager instances
  models.py          User and VisitedState models (the ORM layer)
  auth.py            signup / login / logout routes
  main.py            map page + the per-user JSON API (/api/visited)
  templates/         base, login, signup, index (Jinja2)
  static/
    app.js           map rendering + toggling (talks to the server API)
    backdrop.js      rotating landmark photography (shared by all pages)
    styles.css       design system + motion
    data/            us-atlas states TopoJSON (projected at runtime)
    photos/          landmark photography + CREDITS.md
    vendor/          d3-geo, d3-array, topojson-client, Clash Display + General Sans
migrations/          Flask-Migrate (Alembic) migration scripts
```

## How it fits together

1. A visitor hits `/`; `@login_required` redirects them to `/login` if they aren't signed in.
2. They sign up at `/signup` — the password is hashed and a `User` row is created, then they're logged in.
3. The map page loads the current user's visited states from `GET /api/visited` (scoped to `current_user`).
4. Tapping a state POSTs to `/api/visited/<fips>`, which toggles one `VisitedState` row for that user and returns the new on/off state. The UI updates optimistically and reconciles with the server's response.

Because every API endpoint filters by `current_user.id`, there is no code path that returns another account's data.

## Credits

- Geography: [`us-atlas`](https://github.com/topojson/us-atlas) (U.S. Census Bureau); rendered with [d3-geo](https://github.com/d3/d3-geo) + [topojson-client](https://github.com/topojson/topojson-client).
- Type: [Clash Display](https://www.fontshare.com/fonts/clash-display) & [General Sans](https://www.fontshare.com/fonts/general-sans) (Fontshare, free license).
- Photography: Wikimedia Commons — see [app/static/photos/CREDITS.md](app/static/photos/CREDITS.md) for per-image attribution and licenses (all CC BY-SA).
