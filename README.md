# Fifty 🗺️

An interactive, Awwwards-minded map that tracks **which of the fifty United States I've set foot in.**

Click a state to toggle it. Your progress saves automatically in your browser, and you can export a JSON backup at any time. Bonus tracking for the District of Columbia.

> Tip: drop a screenshot at `docs/preview.png` and it'll show here.

## Highlights

- **Real geography** — accurate state shapes from the U.S. Census (`us-atlas`), not a stylized grid.
- **Bold editorial design** — Fraunces display type, a warm paper palette, paper grain, and a confident vermillion accent. Includes a light/dark theme.
- **Living stats** — animated counter, progress meter, *% of states* and *% of U.S. land area* (computed from the real map geometry).
- **Thoughtful motion** — staggered west→east intro, a spring "pop" when you mark a state, smooth fills. Respects `prefers-reduced-motion`.
- **Accessible** — every state is keyboard-focusable and toggleable (Tab + Enter/Space), with tooltips and ARIA labels. Tiny eastern states get leader-line labels.
- **Zero build, zero backend, offline-capable** — plain HTML/CSS/JS. All libraries and fonts are vendored locally; nothing is fetched at runtime.

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

## Data & backups

- Progress lives in your browser under `localStorage` key `fifty-states-visited:v1`.
- **Export backup** downloads a dated JSON file. **Import backup** restores one. Handy for moving between devices.

## Project layout

```
index.html        markup
styles.css        design system + motion
app.js            map rendering, toggling, stats, persistence
data/             us-atlas states TopoJSON (pre-projected, 975×610)
vendor/           d3-geo, d3-array, topojson-client, fonts (all local)
.github/workflows deploy to GitHub Pages
```

## Credits

- Geography: [`us-atlas`](https://github.com/topojson/us-atlas) (U.S. Census Bureau).
- Rendering: [d3-geo](https://github.com/d3/d3-geo) + [topojson-client](https://github.com/topojson/topojson-client).
- Type: [Fraunces](https://github.com/undercasetype/Fraunces) & [Inter](https://github.com/rsms/inter) (open source).
