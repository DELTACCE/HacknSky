# HacknSky

Website for **HacknSky**, a two-day destination hackathon at Athirappilly Falls, Kerala (DELTA × DATARA’27, Christ College of Engineering, Dept. of CSE (Data Science)). A toon-shaded 3D valley you scroll through, plus plain info pages. Static, no build step for the site itself.

Dates, venue, prizes, people and sponsors are **proposed / to be confirmed**. See `docs/CONTENT-TODO.md`.

## Quick start
```sh
npm install          # three.js and Vite
npm run dev          # http://localhost:5173 with hot reload
npm run build        # generates pages, bundles to dist/
```
Needs Node 20+. Commit the `package-lock.json` that `npm install` creates.

## Layout
```
index.html and <slug>/   under src/: the 3D page and the generated info pages
src/js/            config.js (edit me) · main · ui · world (3D, own chunk) · form · calendar · share · telemetry · pages
src/css/           style.css (3D page) · pages.css (info pages)
public/            copied as-is: icons, OG image, manifest, robots, sitemap, _headers, 404
data/event.json    single source of truth for the info pages
scripts/           build-pages · check-links · get-fonts
tests/             smoke.mjs (headless browser, every page of dist/)
backend/           optional Google Apps Script form receiver
docs/              ARCHITECTURE · ROADMAP · CONTENT-TODO
vite.config.js     multi-page Vite build, three.js split into its own chunk
```

## Everyday tasks
| Task | Command |
|---|---|
| Edit event info, then regenerate pages + sitemap | `npm run pages` |
| Check internal links | `npm run links` |
| Build and smoke-test every page | `npm test` |
| Self-host fonts | `npm run fonts` |

Site-wide settings (dates, registration status, form endpoint, analytics, contact) live in `public/js/config.js`.

## Deploy
Run `npm run build` and upload `dist/` to any static host (serve from the domain root). `vercel.json` and `public/_headers` set caching and security headers. Set your real domain in `config.js` and `data/event.json` (`siteUrl`) first.

See `docs/ARCHITECTURE.md` for how the 3D scene and the phone quality ladder work, and `CONTRIBUTING.md` for the workflow.
