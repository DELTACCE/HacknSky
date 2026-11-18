# Architecture
- **Build:** Vite multi-page. three.js comes from npm and only the classes used are bundled; `world.js` plus three.js load as separate chunks via `import()`, so the loader and plain mode appear immediately and info pages ship no three.js.
- **Boot:** `main.js` → `ui.js` (loader, HUD, sheets, focus trap) → dynamic `world.js` `startWorld()` (fonts, builds the world, compiles shaders, then enters).
- **Plain mode:** `?plain` or the “Plain page” button skips WebGL and shows the content as a normal page. WebGL failure falls back the same way.
- **World (`world.js`):** procedural terrain, river and waterfall sharing one water shader, instanced forests, lodge, summit deck, cable line with gondolas, totems, per-letter 3D captions, camera keyframes with a chase camera for the cable chapter. Toon shading with inverted-hull outlines.
- **Quality ladder (phones):** frame windows of 30; if the average exceeds 24 ms it steps down: 1 forest outlines off · 2 trees 70% · 3 fireflies, grass decor and all outlines off · 4 trees 45%, pixel ratio −0.2 · 5 30 fps. The waterfall foam and mist are exempt. Weak phones (≤4 GB or ≤4 cores) or “Graphics: Low” start at 5. Pixel ratio is budgeted to about 1 megapixel with a floor of 1.25; multisampling is off on phones at 1.5× and above.
- **Forms:** `form.js` posts to `formEndpoint` (see `backend/`), else redirects to `registerUrl`, else falls back to `mailto:`.
- **Telemetry:** `telemetry.js` is a no-op unless `analyticsEndpoint` is set; respects DNT/GPC; sends `perf`, `quality_tier`, `loaded`, `js_error`.
- **Pages:** `scripts/build-pages.mjs` renders `data/event.json` into `public/<slug>/index.html`.
