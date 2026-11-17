// Downloads the exact three.js build this site was written against into public/vendor/, so the site no longer depends on a CDN.
// Run once with internet access:  node scripts/get-three.mjs     (Node 18+)
import { writeFile, mkdir } from "node:fs/promises";
const V = "0.160.0", urls = [`https://cdn.jsdelivr.net/npm/three@${V}/build/three.module.js`, `https://unpkg.com/three@${V}/build/three.module.js`];
await mkdir(new URL("../public/vendor/", import.meta.url), { recursive: true });
for (const u of urls) {
  try { const r = await fetch(u); if (!r.ok) throw new Error(r.status); const b = Buffer.from(await r.arrayBuffer()); if (b.length < 5e5) throw new Error("too small");
    await writeFile(new URL("../public/vendor/three.module.js", import.meta.url), b); console.log("saved public/vendor/three.module.js", (b.length / 1e6).toFixed(2) + " MB from " + u); process.exit(0); }
  catch (e) { console.warn("failed", u, e.message); }
}
console.error("Could not download three.js. Download three.module.js r160 manually into public/vendor/."); process.exit(1);
