# HacknSky

Website for **HacknSky**, a _proposed_ two-day destination hackathon by DELTA as part of DATARA’27
at Christ College of Engineering, Irinjalakuda. The site tells the story as a painterly cel-shaded, low-poly 3D journey
through an imagined Athirappilly valley, then lays out the tracks, route, playground, map, awards
and registration in plain editorial sections.

> **Everything about the event is proposed, not confirmed**: dates, venue, tracks, awards, the Sky
> Storm ride and the team numbers. Keep it labelled that way until each detail is confirmed.

This version combines the visual system and interactive scene of the previous Next.js build with
the copy, route, day plan, FAQ and honesty rules from the Vite build. All content lives in two
files (`lib/config.js`, `lib/content.js`), so nothing in the components needs editing for a copy
change.

Stack: **Next.js 14 (App Router) · React 18 · React Three Fiber · Three.js · GSAP ScrollTrigger ·
Tailwind CSS**. JavaScript/JSX only.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

Requires Node.js 18+.

## What is on the page

The site is a single long page with anchored sections. The fixed navigation highlights the section
under the middle of the viewport.

| Section      | Anchor         | Contents                                                         |
| ------------ | -------------- | ---------------------------------------------------------------- |
| Hero         | `#top`         | Wordmark, tagline, countdown, primary CTAs, proposed notice      |
| Destination  | `#destination` | Athirappilly copy, key facts, arrival beats                      |
| Cable car    | `#cable-car`   | The Sky Storm line, west/east progress, ride disclaimer          |
| Experience   | `#experience`  | Six story chapters: arrival, brief, build, overnight, showcase, ride down |
| Tracks       | `#hackathon`   | Sky, Canopy, River and Summit cards + track status               |
| Route        | `#timeline`    | Four stages from campus briefing to finale, plus the hour-by-hour plan |
| Playground   | `#playground`  | Proposed water-park amenities and illustration                   |
| Map          | `#map`         | Interactive low-poly site map with clickable pins                |
| Awards       | `#competition` | Awards, partners, mentors, judges, sponsor slots                 |
| FAQ          | `#faq`         | Six honest answers about eligibility, dates, fee and the ride    |
| Register     | `#register`    | Countdown, registration/enquiry form, honest empty states        |

## Editing content

- **Event facts** (`lib/config.js`): name, tagline, dates, location, organiser, institution,
  contact email, registration URL and form endpoint.
- **All page copy** (`lib/content.js`): facts, story chapters, tracks, route, day plan, activities,
  awards, people, sponsor slots, partners and FAQ.
- **Metadata** (`app/layout.js`): title, description, Open Graph and Twitter cards.

There is no hidden CMS. If a detail is not confirmed, write `To be announced` rather than inventing
a date, amount or name.

## Registration and enquiries

Copy `.env.example` to `.env.local` and set any of:

| Variable                   | Effect                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_REGISTER_URL` | All Register buttons open this external page (Devfolio, Google Form, ...). The in-page form hides. |
| `NEXT_PUBLIC_FORM_ENDPOINT`| The on-site form POSTs its fields as JSON here. Without it the form sends **nothing**.     |
| `NEXT_PUBLIC_CONTACT_EMAIL`| Shown in the registration panel and footer.                                               |

Until `NEXT_PUBLIC_FORM_ENDPOINT` is set the form validates, then states plainly that applications
are not open and nothing was sent. It never reports success it did not achieve. A partnership
enquiry uses the same form; the event is not open for applications yet.

## The 3D scene

- `components/SceneLayer.js` lazy-loads the WebGL bundle after first paint and checks for WebGL
  support. Nothing three.js-related is part of the first load.
- `components/ScrollController.js` maps scroll position onto a stage (hero → destination → cable
  car → registration), drives the west/east progress bar, adds pointer parallax and runs the GSAP
  reveal animations. Rendering pauses while opaque sections cover the canvas.
- `lib/world.js` holds the shared height function, river line, building pads and cable layout, used
  by both the hero scene and the event map.
- `components/EventMap*.js` is a second lazy canvas with orbit controls and clickable pins.
- All geometry is procedural; there are no model or texture files, so the scene has no external
  asset payload or licence obligations. `lib/toon.js` provides the shared four-step toon gradient
  and inverted-hull ink outlines used by every prop, while the terrain and tree palettes use hard
  light bands instead of smooth PBR shading.
- The background is built in depth: two unlit ridge silhouettes (`Backdrop.js`), a hard cel sun
  with flat halos, merged cumulus clusters with pale ink edges, drifting bird flocks and a hill
  carpet of instanced shrubs. The valley adds curved coconut palms, river reeds, a plank
  footbridge, string lights, a campfire with rising sparks, wildflowers and slide supports so the
  near ground has the same detail as the skyline.
- Lighting is a warm low sun with cool hemisphere fill, soft shadows on desktop, exponential
  height fog, additive god rays, watercolour mist sprites and low-lying fireflies. The terrain
  shader adds a subtle paper-grain variation so large slopes do not read as one flat swatch.
- Tree cover mixes five-tier pines, rounded broadleaf clusters, narrow cypresses and occasional
  blossom trees, each with random rotation, scale and tint. The buildings use terracotta hip
  roofs, deep eaves, wooden verandas, lanterns and bunting; the cable cabins have framed windows,
  doors, headlights, roof vents, an A-frame hanger and undercarriage, while the stations add
  tiered roofs, railings, steps, a mounted sign, machinery and a bench.
- The stream, pool and lazy river share a stylised water shader with scrolling noise, foam bands,
  edge lace and warm sun glints. The hero keeps the world visible with a localised dark scrim and
  a frosted information panel rather than a full-width cream wash; the destination and cable-car
  sections use the same dark glass over the live scene.

The cableway is a conceptual visualisation. It is not an existing cableway and not an exact Sky
Storm replica.

## Project structure

```text
app/
  layout.js            fonts, metadata, viewport
  page.js              page composition, skip link, footer
  globals.css          design tokens, panels, cards, buttons, fields
  icon.svg             favicon
components/
  SceneLayer.js        lazy WebGL host
  HeroScene.js         camera rig, lights, terrain and scene assembly
  ScrollController.js  scroll stages, reveals, progress bar
  Navigation.js        sticky nav, mobile menu, active section
  Hero.js              hero copy, CTAs, countdown
  HackathonSections.js all content sections after the hero
  RegistrationCTA.js   countdown + registration form
  EventMap*.js         second canvas and map UI
  Glyph.js             inline SVG pictograms
  PlaygroundArt.js     SVG water-park illustration
  CableCar.js · Clouds.js · Forest.js · Landmarks.js · LowPolyEnvironment.js · Mountain.js
  Backdrop.js · Birds.js · Sun.js · Undergrowth.js · Flowers.js · Waterfall.js · primitives.js
  Mist.js · Fireflies.js · GodRays.js · CampfireSparks.js
  RegisterButton.js · Countdown.js
lib/
  config.js            event facts and nav links
  content.js           all page copy
  world.js             shared world layout (height, river, pads, cable)
  lowpoly.js · noise.js · ribbon.js · shaders.js · toon.js
  scrollState.js · hooks.js
```

## Accessibility and performance

- Skip link, labelled navigation, `aria-current` on the active section, a focusable mobile menu,
  visible focus rings and reduced-motion support.
- Decorative WebGL layers are hidden from assistive technology.
- The 3D bundle is lazy; first-load JS is around 141 kB and every model is generated in code, so
  the scene adds no model or texture download. The scene pauses when covered by opaque sections,
  drops tree/cloud counts and shadow maps on small screens, and limits DPR to 1.6 on desktop and
  1.25 on mobile.
- Hero contrast was measured from rendered frames: cream headline at least 3.4:1 (large text),
  tagline at least 4.2:1 (large text), body copy 5.7:1 or better, and nav links about 6.4:1.
- The form never fakes a successful submission; its status is announced with `role="status"`.

## Deployment

The app builds with `next build`. Vercel, Netlify and any Node host that supports Next.js work out
of the box. For a purely static host, add `output: "export"` to `next.config.js` and deploy the
generated `out/` folder (no server features are used).

## Credits

Terrain, forest, waterfall, cable car, event map and water park are original procedural
illustrations. No third-party models or textures are bundled. Built with
[three.js](https://threejs.org) (MIT), React Three Fiber, GSAP and Next.js. The event itself is a
proposal by DELTA for DATARA’27.
