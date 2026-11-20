// Entry point: the page chrome (ui.js) is already running; start the 3D world behind the loader.
// ?plain (or the menu button) skips the 3D entirely: the lightest way to read the page on a slow phone.
import { $, ROOT, enter, failWorld, show } from "./ui.js";
import { track } from "./telemetry.js";
import { mobile, textureNames, textureUrl } from "./introAssets.js";

const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } } };
const params = new URLSearchParams(location.search), modes = ["auto", "full", "low"];
const requested = params.get("gfx"), saved = store.get("hns-gfx");
const mode = modes.includes(requested) ? requested : modes.includes(saved) ? saved : "auto";
const plain = params.has("plain") || store.get("hns-plain") === "1";
// Phones now get the same shaders, shadows, ink outlines and density as desktop ("mobile" only tunes the render-buffer budget and
// texture sizes). Only genuinely weak devices (<=2 GB or <=2 cores) fall back to "low"; a runtime resolution guard in world.js
// protects everything else, and the Graphics button still lets anyone pick Low by hand.
const weak = navigator.deviceMemory <= 2 || navigator.hardwareConcurrency <= 2;
const profile = mode !== "auto" ? mode : !mobile ? "full" : weak ? "low" : "mobile";
ROOT.dataset.graphics = plain ? "plain" : profile;
const restart = (url) => { if (url.href === location.href) location.reload(); else location.assign(url.href); };

const gfx = $("#gfx");
gfx.textContent = "Graphics: " + mode[0].toUpperCase() + mode.slice(1);
gfx.disabled = plain;
gfx.onclick = () => {
  const url = new URL(location.href), next = modes[(modes.indexOf(mode) + 1) % modes.length];
  store.set("hns-gfx", next);
  if (store.get("hns-gfx") === next) url.searchParams.delete("gfx"); else url.searchParams.set("gfx", next);
  restart(url);
};

const pb = $("#plainbtn");
if (pb) {
  pb.textContent = plain ? "Back to the 3D valley" : "Plain page (no 3D)";
  pb.onclick = () => { const url = new URL(location.href); store.set("hns-plain", plain ? "0" : "1"); if (!plain && store.get("hns-plain") !== "1") url.searchParams.set("plain", ""); else url.searchParams.delete("plain"); restart(url); };
}

const rb = $("#replaybtn");
track("page_view", { plain });
if (plain) {
  const introEl = document.getElementById("brand-intro");
  if (introEl) introEl.remove();
  ROOT.classList.add("nogl");
  enter(true);
} else start().catch((e) => failWorld("Couldn’t load the 3D scene: " + e.message));

async function start() {
  show(4, "Loading engine");
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const name of textureNames) {
      const link = document.createElement("link");
      link.rel = "preload"; link.as = "image"; link.crossOrigin = "anonymous"; link.href = textureUrl(name);
      document.head.append(link);
    }
  }
  let finishFlight, finishIntro;
  const flightDone = new Promise((resolve) => { finishFlight = resolve; });
  const introDone = new Promise((resolve) => { finishIntro = resolve; });
  let ready = false;
  const world = Promise.all([import("./world.js"), mobile && flightDone]).then(([m]) => m.startWorld(profile, introDone, mobile)).then(() => { ready = true; })
    .catch((e) => failWorld("Couldn’t load the 3D scene: " + e.message));
  const waitForWorld = () => {
    finishFlight(); // Static fallback and safety timeout can skip the animation.
    finishIntro();
    if (!ready) $("#loadout").classList.add("waiting");
    return world;
  };
  const { playIntro } = await import("./intro.js").catch(() => ({}));
  const revealValley = () => {
    if (ROOT.classList.contains("nogl")) $("#loadout").classList.remove("gone");
    else enter(false);
  };
  if (playIntro) {
    await new Promise((onDone) => {
      playIntro({ onFlightEnd: finishFlight, waitForWorld, onExit: revealValley, onDone });
    });
    if (rb) rb.onclick = () => playIntro();
  } else {
    $("#brand-intro").classList.add("is-playing");
    $("#intro-fallback").style.display = "grid";
    await waitForWorld();
    $("#brand-intro").remove();
    revealValley();
  }
}
