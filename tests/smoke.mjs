// Smoke test: serves the site, loads every page in headless Chromium, fails on page errors or missing links.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
const port = 8123, srv = spawn("python3", ["tools/serve.py", String(port)], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1200));
const pages = ["", "?plain", "schedule/", "prizes/", "rules/", "faq/", "venue/", "team/", "sponsors/", "contact/", "register/", "privacy/", "terms/", "code-of-conduct/", "past/"];
const b = await chromium.launch(); let bad = 0;
for (const p of pages) {
  const pg = await b.newPage(), errs = [];
  pg.on("pageerror", (e) => errs.push(e.message));
  pg.on("response", (r) => { if (r.status() >= 400 && !r.url().includes("vendor/three")) errs.push(r.status() + " " + r.url()); });
  await pg.goto(`http://localhost:${port}/${p}`); await pg.waitForTimeout(p === "" ? 2500 : 500);
  const h1 = p.startsWith("?") || p === "" ? true : await pg.locator("h1").count();
  if (errs.length || !h1) { bad++; console.log("FAIL", p || "/", errs.join(" | ")); } else console.log("ok  ", p || "/");
  await pg.close();
}
await b.close(); srv.kill(); process.exit(bad ? 1 : 0);
