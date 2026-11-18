// Entry point: the page chrome (ui.js) is already running; start the 3D world behind the loader.
// ?plain (or the menu button) skips the 3D entirely: the lightest way to read the page on a slow phone.
import { $, ROOT, enter, failWorld, show } from "./ui.js";
import { track } from "./telemetry.js";

const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } } };
const params = new URLSearchParams(location.search), modes = ["auto", "full", "low"];
const requested = params.get("gfx"), saved = store.get("hns-gfx");
const mode = modes.includes(requested) ? requested : modes.includes(saved) ? saved : "auto";
const plain = params.has("plain") || store.get("hns-plain") === "1";
const mobile = matchMedia("(pointer: coarse)").matches || screen.width < 700;
const profile = mode !== "auto" ? mode : !mobile ? "full" : (navigator.deviceMemory <= 4 || navigator.hardwareConcurrency <= 4) ? "low" : "mobile";
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
} else if (mobile && !location.hash && mode === "auto" && !store.get("hns-intro-seen")) {
  const choice = $("#entry-choice"); choice.showModal();
  choice.addEventListener("close", () => { store.set("hns-intro-seen", "1"); start(); }, { once: true }); $("#explore-3d").onclick = () => choice.close();
} else start();

function start() {
  const play = () => import("./intro.js").then(({ playIntro }) => playIntro()).catch(() => $("#brand-intro")?.remove());
  if (rb) rb.onclick = play;
  play();
  // the 3D engine is its own chunk, fetched while the loader shows progress
  show(4, "Loading engine");
  import("./world.js").then((m) => m.startWorld(profile)).catch((e) => failWorld("Couldn’t load the 3D scene: " + e.message));
}
