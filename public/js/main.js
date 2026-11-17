// Entry point: the page chrome (ui.js) is already running; start the 3D world behind the loader.
// ?plain (or the menu button) skips the 3D entirely: the lightest way to read the page on a slow phone.
import { $, ROOT, enter, failWorld } from "./ui.js";
import { startWorld } from "./world.js";
import { track } from "./telemetry.js";

const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } } };
const plain = new URLSearchParams(location.search).has("plain") || store.get("hns-plain") === "1";

const pb = $("#plainbtn");
if (pb) {
  pb.textContent = plain ? "Back to the 3D valley" : "Plain page (no 3D)";
  pb.onclick = () => { store.set("hns-plain", plain ? "0" : "1"); const u = new URL(location.href); u.searchParams.delete("plain"); location.href = u.href; };
}

track("page_view", { plain });
if (plain) { ROOT.classList.add("nogl"); enter(true); }
else startWorld().catch((e) => failWorld("Scene error: " + e.message));
