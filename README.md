# HacknSky

Website for **HacknSky**, a two-day destination hackathon at Athirappilly Falls, Kerala (DELTA × DATARA’27, Christ College of Engineering, Dept. of CSE (Data Science)). A toon-shaded 3D valley you scroll through, plus plain info pages. Static, no build step for the site itself.

Dates, venue, prizes, people and sponsors are **proposed / to be confirmed**. See `docs/CONTENT-TODO.md`.

## Quick start
```sh
node scripts/get-three.mjs     # once, needs internet: downloads three.js r160 into public/vendor/
python3 tools/serve.py         # http://localhost:8080  (ES modules need http, not file://)
```
Without the vendor file the site falls back to CDNs.

## Layout
```
public/            everything that gets deployed
  index.html       the 3D page
  js/              config.js (edit me) · main · ui · world (3D) · form · calendar · share · telemetry · pages
  css/             style.css (3D page) · pages.css (info pages)
  assets/ vendor/  icons, OG image, three.js
  schedule/ faq/ … generated info pages (do not edit by hand)
data/event.json    single source of truth for the info pages
scripts/           build-pages · check-links · get-three · get-fonts
tests/             smoke.mjs (headless browser, every page)
backend/           optional Google Apps Script form receiver
docs/              ROADMAP · CONTENT-TODO · ARCHITECTURE
tools/             local dev server
```

## Everyday tasks
| Task | Command |
|---|---|
| Edit event info, then regenerate pages + sitemap | `npm run build` |
| Check internal links | `npm run links` |
| Smoke-test every page (needs `npm i -D playwright`) | `npm test` |
| Self-host fonts | `npm run fonts` |

Site-wide settings (dates, registration status, form endpoint, analytics, contact) live in `public/js/config.js`.

## Deploy
Upload `public/` to any static host. `vercel.json` (Vercel) and `public/_headers` (Netlify / Cloudflare Pages) set caching and security headers. Set your real domain in `config.js` and `data/event.json` (`siteUrl`), then `npm run build`.

See `docs/ARCHITECTURE.md` for how the 3D scene and the phone quality ladder work, and `CONTRIBUTING.md` for the workflow.
