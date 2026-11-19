# Changelog

## Loader rehearsal + full-quality phones
- The loader now builds every caption texture, decodes every image (lazy ones included), compiles every shader and uploads every buffer, including off-screen and hidden objects.
- It then replays the whole page scroll, top to bottom, through the live update/draw code behind the loading screen, so the first real scroll is as smooth as the second.
- Phones get the same shaders, shadows, ink outlines, grass and glyph-by-glyph captions as desktop (only genuinely weak devices fall back to Low). A resolution-only guard lowers pixel count if a device cannot hold ~30 fps; effects are never removed.

## 1.0.0
First complete version: 3D valley, loader, phone quality ladder, info pages, registration flow, tests and CI.

## Unreleased
- Fix: waterfall no longer degrades into bands after a long session.
- Build: moved to Vite with three.js from npm (tree-shaken, own chunk).
- Footer removed from the 3D page; mobile heading for the last chapter narrowed.
