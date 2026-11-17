Put `three.module.js` (three.js r160) in this folder: run `node scripts/get-three.mjs` once with internet.
The site loads `public/vendor/three.module.js` first and falls back to a CDN if it is missing, so it still works without it,
but self-hosting is faster, works behind restrictive networks, and is the only way to guarantee the version.
