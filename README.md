# HACKnSKY

Website for **HACKnSKY**, a *proposed* two-day destination hackathon by DELTA as part of DATARA’27
(Christ College of Engineering, Irinjalakuda). It tells the story of the event as a scroll-driven
journey through a procedural 3D Athirappilly valley, and has dedicated pages for the details.

> **Everything about the event is proposed, not confirmed** — dates, venue, tracks, awards, the
> Sky Storm ride and the team numbers. Keep it labelled that way until it is confirmed.

Stack: **Vite · React 18 · React Router 6 · Three.js r128 (pinned) · plain CSS** — JavaScript/JSX only.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # serve the production build locally
npm run lint       # ESLint
npm run format     # Prettier
```

Requires Node.js 18+.

## Pages

| Route       | Page     | Contents                                                        |
| ----------- | -------- | --------------------------------------------------------------- |
| `/`         | Home     | Immersive 3D scroll journey (8 chapters) + links to everything  |
| `/about`    | About    | Concept, key (proposed) numbers, the ride, FAQ                  |
| `/timeline` | Timeline | Route from campus briefing to the ride down + hour-by-hour plan |
| `/tracks`   | Tracks   | Challenge tracks and mentors/judges (placeholders)              |
| `/sponsors` | Sponsors | Awards, sponsors and institutions (placeholders)                |
| `/register` | Register | Team application / partnership enquiry form                     |

`/register?type=partnership` pre-selects the partnership enquiry.

## Going live: registration

Copy `.env.example` to `.env` and set any of:

| Variable             | Effect                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------- |
| `VITE_APPLY_URL`     | All “Join the adventure” buttons open this external registration page.                 |
| `VITE_FORM_ENDPOINT` | The on-site form POSTs its fields as JSON here. Without it the form sends **nothing**. |
| `VITE_CONTACT_EMAIL` | Shown on the registration page.                                                        |

Until `VITE_FORM_ENDPOINT` is set the form validates, then states plainly that applications are not
open and nothing was sent. It never reports success it did not achieve.

## Project structure

```text
public/                  static files served as-is (favicon, _redirects)
  assets/{images,textures,icons,models}/   see "Assets" below
src/
  main.jsx · App.jsx     entry + routes (Home is lazy-loaded so three.js is only fetched there)
  pages/                 one file per route
  components/            Navbar, Footer, Hero, Journey, Timeline, Tracks, Mentors, Partners,
                         FAQ, Registration + shared Section / PageHeader / CtaLink
  data/                  ALL copy and event facts (site.js, journey.js, timeline.js, content.js)
  hooks/                 useReducedMotion, usePageTitle
  utils/                 viewport checks, journey panel updates, asset URL helper
  styles/                variables.css (tokens) · global.css · sections.css · responsive.css
  three/                 the 3D world (see below)
```

Content lives in `src/data/`, not in components. To change a chapter, a timeline entry, an FAQ
answer or a placeholder, edit the data file.

### The 3D world (`src/three/`)

| File                  | Responsibility                                                                 |
| --------------------- | ------------------------------------------------------------------------------ |
| `Scene.jsx`           | React host: canvas, render loop, scroll/resize/pointer listeners, full cleanup |
| `createWorld.js`      | Builds the scene from the modules below; exposes `update` / `dispose`          |
| `context.js`          | Shared context (helpers, renderer, scene, loading-step reporter)               |
| `renderer.js`         | WebGL renderer setup (throws if WebGL is unavailable → fallback)               |
| `Environment.js`      | Fog, sky dome, sun + hemisphere light, ridgelines, drifting valley mist        |
| `Terrain.js`          | Height field, vertex-coloured terrain, river                                   |
| `Waterfall.js`        | Waterfall shader ribbon and base mist                                          |
| `CableCar.js`         | Cable route, towers, stations, rope, animated gondolas                         |
| `Forest.js`           | Procedural rainforest trees, palms, bushes and boulders (instanced)            |
| `WaterPark.js`        | Conceptual event space: plaza, wave pool, slides, pavilion, tables             |
| `CameraController.js` | Keyframed camera path and scene-shift away from chapter text                   |

All geometry and textures are generated in code — there are no model or image files to load. Scroll
progress (0–1) drives the camera and the chapter panels (`src/utils/journeyPanels.js`). Panel opacity
is written straight to the DOM each frame on purpose (60 fps without React renders).

Fallbacks: the journey becomes a plain stacked, fully readable layout when the screen is short,
`prefers-reduced-motion` is set, WebGL is unavailable, the context is lost, or the 3D chunk fails to
load. Three.js is pinned to **r128** because the scene code targets that API.

## Assets

- `public/assets/images` photos · `textures` texture maps · `icons` logos/icons · `models` 3D models.
  These folders are empty on purpose: the site uses procedural 3D and has no confirmed sponsor logos,
  people or photography. **Do not add placeholder logos or people.**
- Use `ASSETS` from `src/utils/assets.js` to reference files (it respects Vite’s `base`).
- Fonts (Fraunces, Manrope) load from Google Fonts in `index.html` with system fallbacks. To
  self-host, add font files under `public/fonts/` and replace the `<link>` with `@font-face` rules.

## Styling notes

The CSS was migrated from the original single-file site and split by component. Within each file the
rules keep their original order, because the design relies on layered overrides; responsive rules
therefore stay next to the component they belong to (`responsive.css` holds page-level layout).
Tokens (colours, fonts) are in `styles/variables.css`.

## Accessibility

Skip links, a focus-trapped mobile menu (`Escape` closes, the page behind is `inert`), focus moved to
`<main>` on navigation, `aria-current` on the chapter rail, off-screen chapters are `inert`,
reduced-motion support, and per-page titles.

## Deployment

`npm run build` outputs static files to `dist/`. Any static host works, but it must rewrite unknown
paths to `index.html` (a Netlify `_redirects` file is included; add the equivalent for Vercel, Nginx
or Apache). If hosting under a sub-path, set `base` in `vite.config.js`.

## Credits

Terrain, forest, waterfall, cable car and water park are original procedural illustrations. They do
not depict a confirmed venue or an exact Sky Storm replica. Built with [three.js](https://threejs.org)
(MIT), React and Vite.
