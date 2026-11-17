# Contributing
- Branch from `main`; one change per commit, [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `perf:`, `docs:`, `chore:`, `test:`).
- Content changes go in `data/event.json` or `public/js/config.js`, then `npm run build`. Never hand-edit generated pages.
- Before pushing: `npm run build && npm run links && npm test`.
- Do not invent facts (prizes, names, fees). Use “to be confirmed”.
- 3D changes cannot be checked headless: test on a real phone and a desktop, and keep the waterfall and captions as they are unless asked.
