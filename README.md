# Fifty

An interactive map that tracks **which of the fifty United States I've visited** — set over full-bleed, slowly drifting photography of iconic American landmarks.

Tap a state to light it up. Progress saves automatically in your browser, and you can optionally sync across devices via a private GitHub gist.

> Tip: drop a screenshot at `docs/preview.png` and it'll show here.

## Design

A cinematic, monochrome interface inspired by award-winning app design — full-bleed photography with frosted-glass panels floating over it, one oversized "hero number," and ruthless restraint everywhere else.

- **Full-bleed photography** of US landmarks (Golden Gate, Manhattan, Grand Canyon, Chicago, Monument Valley, New Orleans, Seattle) cross-fading with a slow Ken-Burns drift; the current location is named in the caption.
- **Frosted-glass UI** — the progress panel and the map sit on blurred glass surfaces over the imagery.
- **Monochrome / ice-white** — no color accent; visited states glow crisp white and the photography supplies all the color.
- **Type** — [Clash Display](https://www.fontshare.com/fonts/clash-display) for the hero numerals and [General Sans](https://www.fontshare.com/fonts/general-sans) for UI (both self-hosted).
- **Living stats** — animated counter, progress meter, *% of the country* and *% of U.S. land area* (computed from the real map geometry).
- **Cross-device sync** — connect a private GitHub gist with a one-time token and every tap saves to all your devices. No server, no account.
- **Accessible** — every state is keyboard-focusable and toggleable (Tab + Enter/Space); respects `prefers-reduced-motion`.

## Run locally

The app loads a local map file and photos, so open it through a tiny web server (not `file://`):

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

The **Local only** pill (top right) opens the sync panel. It stores your map in a **private GitHub gist** so it follows you everywhere:

1. Click **Create a GitHub token →** — the link is pre-scoped to **`gist` only**, so the token can't read or write anything else in your account. Choose *No expiration* to keep it working. (Use a **classic** token; the `gist` scope is the reliable one for the Gists API.)
2. Paste the token and hit **Connect**. The app creates a private `visited.json` gist and saves every change to it.
3. On another device, paste the **same token** — it finds your existing gist automatically. No gist IDs to copy.

On load, the gist is the source of truth; `localStorage` is kept as an offline cache. **Disconnect** clears the token from the browser; revoke it entirely from **GitHub → Settings → Developer settings → Tokens**.

## Backups

- Local progress lives under `localStorage` key `fifty-states-visited:v1` (token under `fifty-gh-token`, gist id under `fifty-gist-id`).
- **Export** downloads a dated JSON file; **Import** restores one — handy as a manual snapshot even with sync on.

## Project layout

```
index.html        markup
styles.css        design system + motion
app.js            map rendering, toggling, stats, gist sync, photo rotation
data/             us-atlas states TopoJSON (lon/lat, projected at runtime)
photos/           landmark photography + CREDITS.md
vendor/           d3-geo, d3-array, topojson-client, Clash Display + General Sans
.github/workflows deploy to GitHub Pages
```

## Credits

- Geography: [`us-atlas`](https://github.com/topojson/us-atlas) (U.S. Census Bureau); rendered with [d3-geo](https://github.com/d3/d3-geo) + [topojson-client](https://github.com/topojson/topojson-client).
- Type: [Clash Display](https://www.fontshare.com/fonts/clash-display) & [General Sans](https://www.fontshare.com/fonts/general-sans) (Fontshare, free license).
- Photography: Wikimedia Commons — see [photos/CREDITS.md](photos/CREDITS.md) for per-image attribution and licenses (all CC BY-SA).
