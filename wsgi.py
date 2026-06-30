"""WSGI entry point.

`gunicorn wsgi:app` uses the `app` object below in production. Running this file
directly (`python wsgi.py`) starts Flask's built-in dev server, reading PORT from
the environment and defaulting to 5000.
"""

import os

from app import create_app

app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # host=0.0.0.0 so the server is reachable from outside the container/VM too.
    app.run(host="0.0.0.0", port=port, debug=True)
