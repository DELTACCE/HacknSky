// Self-host Outfit (needs internet; not run in the build sandbox). Usage: node scripts/get-fonts.mjs
import { mkdirSync, writeFileSync } from "node:fs";
const css = await (await fetch("https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap", { headers: { "User-Agent": "Mozilla/5.0 Chrome/120" } })).text();
mkdirSync("public/assets/fonts", { recursive: true }); let out = css, i = 0;
for (const u of new Set(css.match(/https:\/\/fonts\.gstatic\.com[^)]+/g) || [])) { const n = `outfit-${i++}.woff2`; writeFileSync(`public/assets/fonts/${n}`, Buffer.from(await (await fetch(u)).arrayBuffer())); out = out.split(u).join(`../assets/fonts/${n}`); }
writeFileSync("public/css/fonts.css", out); console.log("wrote css/fonts.css; link it and remove the Google Fonts <link> from index.html");
