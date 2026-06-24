# Fifty 🗺️

An interactive, Awwwards-minded map that tracks **which of the fifty United States I've set foot in.**

Click a state to toggle it. Progress saves automatically in your browser, and you can optionally sync across devices via a private GitHub gist. Bonus tracking for the District of Columbia.

> Tip: drop a screenshot at `docs/preview.png` and it'll show here.

## Highlights

- **Real geography** — accurate state shapes from the U.S. Census (`us-atlas`), not a stylized grid.
- **Bold editorial design** — Fraunces display type, a warm paper palette, paper grain, and a confident vermillion accent. Includes a light/dark theme.
- **Living stats** — animated counter, progress meter, *% of states* and *% of U.S. land area* (computed from the real map geometry).
- **Cross-device sync** — connect a private GitHub gist with a one-time token and every click saves instantly to all your devices. No server, no new account.
- **Thoughtful motion** — staggered west→east intro, a spring "pop" when you mark a state, smooth fills. Respects `prefers-reduced-motion`.
- **Accessible** — every state is keyboard-focusable and toggleable (Tab + Enter/Space), with tooltips and ARIA labels. Tiny eastern states get leader-line labels.
- **Zero build, zero backend, offline-capable** — plain HTML/CSS/JS. All libraries and fonts are vendored locally; the only optional network call is to GitHub's gist API when you turn sync on.

## Run locally

Because the app loads a local JSON map file, open it through a tiny web server (not `file://`):

```bash
cd states-visited
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

This repo includes a workflow at `.github/workflows/deploy.yml` that publishes the site as-is (no build step).

1. Push this folder to a GitHub repository.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`. The site deploys to `https://<you>.github.io/<repo>/`.

## Sync across devices (optional)

Clicking **Local only** (the pill in the left column) opens the sync panel. It stores your map in a **private GitHub gist** so it follows you everywhere:

1. Click **Create a GitHub token →** — the link is pre-scoped to **`gist` only**, so the token can't read or write anything else in your account. Choose *No expiration* if you want it to keep working indefinitely. (Use a **classic** token; the `gist` scope is the reliable one for the Gists API.)
2. Paste the token into the panel and hit **Connect**. The app creates a private gist named `visited.json` and starts saving every change to it.
3. On another device, open the site and paste the **same token** — it finds your existing gist automatically and syncs. No gist IDs to copy.

How it behaves:

- Each toggle saves to the gist (debounced, so rapid clicks become one write). The pill shows **Synced / Saving… / Offline**.
- On load, the gist is the source of truth — the remote copy is pulled in. `localStorage` is kept as an offline cache, so the map still works with no connection and catches up when you reconnect.
- **Disconnect** any time to clear the token from this browser; revoke it entirely from **GitHub → Settings → Developer settings → Tokens**.

The token is stored only in your browser's `localStorage` and is sent solely to `api.github.com`.

## Backups

- Local progress lives under `localStorage` key `fifty-states-visited:v1` (token under `fifty-gh-token`, gist id under `fifty-gist-id`).
- **Export backup** downloads a dated JSON file; **Import backup** restores one. Useful as a manual snapshot even when sync is on.

## Project layout

```
index.html        markup
styles.css        design system + motion
app.js            map rendering, toggling, stats, persistence, gist sync
data/             us-atlas states TopoJSON (lon/lat, projected at runtime)
vendor/           d3-geo, d3-array, topojson-client, fonts (all local)
.github/workflows deploy to GitHub Pages
```

## Credits

- Geography: [`us-atlas`](https://github.com/topojson/us-atlas) (U.S. Census Bureau).
- Rendering: [d3-geo](https://github.com/d3/d3-geo) + [topojson-client](https://github.com/topojson/topojson-client).
- Type: [Fraunces](https://github.com/undercasetype/Fraunces) & [Inter](https://github.com/rsms/inter) (open source).
