// Entry point: the page chrome (ui.js) is already running; start the 3D world behind the loader.
// ?plain (or the menu button) skips the 3D entirely: the lightest way to read the page on a slow phone.
import { $, ROOT, enter, failWorld, show } from "./ui.js";
import { track } from "./telemetry.js";
import { initIntro, playIntro } from "./intro.js";

const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } } };
const plain = new URLSearchParams(location.search).has("plain") || store.get("hns-plain") === "1";

const pb = $("#plainbtn");
if (pb) {
  pb.textContent = plain ? "Back to the 3D valley" : "Plain page (no 3D)";
  pb.onclick = () => { store.set("hns-plain", plain ? "0" : "1"); const u = new URL(location.href); u.searchParams.delete("plain"); location.href = u.href; };
}

const rb = $("#replaybtn");
if (rb) {
  rb.onclick = () => playIntro();
}

track("page_view", { plain });
if (plain) {
  const introEl = document.getElementById("brand-intro");
  if (introEl) introEl.remove();
  ROOT.classList.add("nogl");
  enter(true);
} else {
  initIntro();
  // the 3D engine is its own chunk, fetched while the loader shows progress
  show(4, "Loading engine");
  import("./world.js").then((m) => m.startWorld()).catch((e) => failWorld("Couldn’t load the 3D scene: " + e.message));
}
