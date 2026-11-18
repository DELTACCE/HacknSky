// Smoke test: serves the site, loads every page in headless Chromium, fails on page errors or missing links.
import { chromium } from "playwright";
import { preview } from "vite";
import assert from "node:assert/strict";
const pages = ["", "?plain", "guide/", "schedule/", "prizes/", "rules/", "faq/", "venue/", "team/", "sponsors/", "contact/", "register/", "privacy/", "terms/", "code-of-conduct/", "past/"];
const server = await preview({ preview: { host: "127.0.0.1", port: 0, strictPort: true } });
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
let b;
let bad = 0;
try {
  b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const p of pages) {
    const pg = await b.newPage({ reducedMotion: "reduce" }), errs = [], requests = [];
    pg.on("pageerror", (e) => errs.push(e.message));
    pg.on("request", (r) => requests.push(r.url()));
    pg.on("response", (r) => { if (r.status() >= 400) errs.push(r.status() + " " + r.url()); });
    if (p === "") pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    await pg.goto(`${base}/${p}`);
    if (p === "") {
      await pg.locator("#loadout.gone").waitFor({ state: "attached", timeout: 30000 });
      await pg.locator("#gl[data-valley=ready]").waitFor();
      for (const [id, chapter] of [["destination", "02"], ["cable-car", "03"]]) {
        await pg.locator("#" + id).evaluate((el) => window.scrollTo(0, el.offsetTop + 100));
        await pg.waitForFunction((n) => document.querySelector("#cn").textContent === n, chapter);
      }
    }
    if (p === "?plain") {
      await pg.locator("html.nogl #loadout.gone").waitFor({ state: "attached" });
      assert(!requests.some((url) => /\/assets\/(?:world|three|intro)-/.test(url)), "Plain mode loaded a 3D bundle");
    }
    if (p === "register/") {
      await pg.getByText("Registration opens soon.", { exact: true }).waitFor();
      assert.equal(await pg.locator("form input").count(), 0);
    }
    const h1 = p.startsWith("?") || p === "" ? true : await pg.locator("h1").count();
    if (errs.length || !h1) { bad++; console.log("FAIL", p || "/", errs.join(" | ")); } else console.log("ok  ", p || "/");
    await pg.close();
  }
  const fallback = await b.newPage();
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes("webgl") ? null : getContext.call(this, type, ...args);
    };
  });
  await fallback.goto(`${base}/#destination`);
  await fallback.locator("html.nogl #skip").click();
  await fallback.locator("#loadout.gone").waitFor({ state: "attached" });
  assert(await fallback.locator("#destination h2").isVisible(), "WebGL fallback did not expose the content");
  console.log("ok   WebGL fallback");
  assert(await fallback.evaluate(() => Math.abs(document.querySelector('#destination').getBoundingClientRect().top) < 2), "Lost the chapter anchor");
  const phone = await b.newPage({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } });
  const downloads = []; phone.on("request", r => downloads.push(r.url()));
  await phone.goto(base); await phone.locator("#entry-choice a").click();
  await phone.getByRole("heading", { name: "Participant guide", exact: true }).waitFor();
  assert(!downloads.some(url => /\/assets\/(?:world|three|intro)-/.test(url)), "Guide choice downloaded 3D");
  console.log("ok   Mobile guide without 3D");
} finally {
  await b?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
process.exitCode = bad ? 1 : 0;
