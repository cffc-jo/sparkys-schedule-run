# Sparky's Schedule Run

Chicago Fire FC 2027-28 schedule release game. Vanilla HTML/CSS/JS + canvas, no build step, hosted on GitHub Pages.

> Work in progress — full README (deploying, swapping the schedule and logos, sprite sheet, leaderboard, QA checklist, config reference) lands in Phase 6.

## Run locally

ES modules need a web server (opening `index.html` from disk won't work). Any static server will do. With no Node installed on Windows:

```bash
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

Then open http://localhost:8541/ (add `?debug=1` for developer tools).

## Where things live

- `config/schedule.json` — season and match list (the only file staff should edit at release)
- `config/game.js` — every gameplay tunable, commented
- `config/palette.js` — official club colours
- `config/sprites.js` — Sparky sprite sheet frame map
- `config/links.js` — schedule link, UTM tags, share text
