// ===========================================================================
// HacknSky · page chrome: config, chapters, tracks, HUD, briefing sheets, loader meter
// (the 3D world lives in world.js)
// Chapters of one 3D world: loadout, falls, cable car, base camp, track totems,
// lagoon, bridge, summit deck, register. Full text lives in on-demand briefings.
// ===========================================================================
import { CONFIG, TRACKS } from "./config.js";
import { track } from "./telemetry.js";
import { mountRegistration } from "./form.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ROOT = document.documentElement;

// one entry per scroll chapter (order = camera keyframe index)
const CH = [
  { id: "top", name: "Arrive", obj: "Arrive in the valley", sheet: null, d: 0.1 },
  { id: "destination", name: "The falls", obj: "Find the falls", sheet: "dest" },
  { id: "cable-car", name: "Cable car", obj: "Ride the Sky Storm line", sheet: "cable", d: 0, lin: true },
  { id: "experience", name: "Base camp", obj: "Reach base camp", sheet: "day" },
  { id: "hackathon", name: "Tracks", obj: "Choose your altitude", sheet: "tracks" },
  { id: "playground", name: "Playground", obj: "Cool off at the lagoon", sheet: "play" },
  { id: "route", name: "Route", obj: "Cross the bridge", sheet: "route" },
  { id: "competition", name: "Summit deck", obj: "Climb to the summit deck", sheet: "awards" },
  { id: "register", name: "Register", obj: "Claim your cabin", sheet: "register" },
];
const Game = { started: false, sheetOpen: false, squad: -1, onSquad: [], onStart: null };
try { const v = localStorage.getItem("hns-track"); if (v !== null && TRACKS[+v]) Game.squad = +v; } catch (e) { /* storage unavailable */ }

// ---- opening loadout ------------------------------------------------------
const bootT0 = performance.now(), loadout = $("#loadout"), skip = $("#skip"), bar = $("#barfill"), bootmsg = $("#bootmsg");
ROOT.style.overflow = "hidden";
$("#rail").innerHTML = CH.map((c, i) => `<button data-ch="${i}" aria-label="${c.name}" title="${c.name}"><i></i></button>`).join("");
let ldP = 0, ldS = 0; const ldWire = $("#ldwire"), ldCab = $("#ldcab");
(function ldTick() { // the loader gondola glides along the wire in step with the real progress
  if (loadout.classList.contains("gone")) return; ldS += (ldP - ldS) * 0.07; const L = ldWire.getTotalLength(), q = ldWire.getPointAtLength(L * (0.03 + 0.94 * ldS / 100)); ldCab.setAttribute("transform", `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`); requestAnimationFrame(ldTick);
})();
let shown = 0, slowNet = false; setTimeout(() => (slowNet = true), 9000);
const show = (v, m) => { v = Math.min(100, Math.max(shown, Math.round(v))); shown = v; ldP = v; bar.style.width = v + "%"; bootmsg.textContent = (v < 100 ? `${m}… ${v}%` : m) + (slowNet && v < 100 ? " · slow connection" : ""); };
const boot = async (p, m) => { show(38 + p * 0.62, m); await new Promise((r) => setTimeout(r, 30)); }; // world-building steps use 38..100 of the bar; engine 0..30, fonts 30..38
const showError = (m) => { const t = $("#toast"); t.textContent = m; t.style.display = "block"; setTimeout(() => (t.style.display = "none"), 6000); console.error(m); };
const failWorld = (m) => { ROOT.classList.add("nogl"); bootmsg.textContent = m; skip.style.display = "inline-flex"; const rt = $("#retry"); if (rt) { rt.style.display = "inline-flex"; rt.onclick = () => location.reload(); } console.error(m); };
function enter(plain) {
  loadout.classList.add("gone"); ROOT.style.overflow = ""; Game.started = true; scrollTo(0, 0);
  if (!plain && Game.onStart) Game.onStart();
}
skip.onclick = () => enter(true);

// ---- squad (chosen track) -------------------------------------------------
function renderSquad() {
  $$("[data-track]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.track === Game.squad)));
  $("#sqt").textContent = "Squad: " + (Game.squad >= 0 ? TRACKS[Game.squad].k : "undecided");
  const f = $("#f-track"); if (f) f.value = Game.squad >= 0 ? String(Game.squad) : "";
}
function setSquad(i) {
  track("track_pick", { track: TRACKS[i] && TRACKS[i].k }); Game.squad = i; try { localStorage.setItem("hns-track", String(i)); } catch (e) { /* ignore */ }
  renderSquad(); Game.onSquad.forEach((f) => f(i));
}

// ---- briefing sheets ------------------------------------------------------
const sheet = $("#sheet"), sbody = $("#sbody"); let lastFocus = null;
// while a briefing is open the page behind it is inert: keyboard and screen readers stay inside the dialog
const setInert = (on) => $$("#hdr, main, #hud").forEach((el) => { el.inert = on; });
sheet.addEventListener("keydown", (e) => { // simple focus trap
  if (e.key !== "Tab" || !Game.sheetOpen) return; const f = $$("button, a[href], input, select, textarea", $(".panel")).filter((x) => !x.disabled && x.offsetParent !== null); if (!f.length) return;
  const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
function openSheet(key) {
  const t = document.getElementById("sheet-" + key); if (!t) return;
  lastFocus = document.activeElement; $("#s-eb").textContent = t.dataset.eb; $("#s-h").textContent = t.dataset.h;
  sbody.replaceChildren(t.content.cloneNode(true));
  const grid = $("#trk-grid", sbody);
  if (grid) grid.innerHTML = TRACKS.map((tr, i) => `<button class="trk" data-track="${i}" aria-pressed="false"><span class="k"><i style="background:${tr.col}"></i>Track 0${i + 1}</span><h3>${tr.k}</h3><p>${tr.tag}</p><p style="margin-top:.5rem;opacity:.65">${tr.ask}</p></button>`).join("");
  const mount = $("#reg-mount", sbody); if (mount) mountRegistration(mount, { squad: Game.squad });
  renderSquad(); track("sheet_open", { key }); sheet.classList.add("open"); ROOT.style.overflow = "hidden"; Game.sheetOpen = true; setInert(true);
  $(".panel").scrollTop = 0; $("#sx").focus();
}
function closeSheet() {
  if (!Game.sheetOpen) return; sheet.classList.remove("open"); ROOT.style.overflow = ""; Game.sheetOpen = false; setInert(false);
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
const drawer = $("#drawer"), menu = $("#menu"), hdr = $("#hdr");
const setDrawer = (o) => { drawer.classList.toggle("open", o); hdr.classList.toggle("solid", o); menu.setAttribute("aria-expanded", String(o)); ROOT.style.overflow = o ? "hidden" : ""; };
menu.onclick = () => setDrawer(!drawer.classList.contains("open"));
document.addEventListener("click", (e) => {
  const s = e.target.closest("[data-sheet]");
  if (s) { e.preventDefault(); if (drawer.classList.contains("open")) setDrawer(false); openSheet(s.dataset.sheet); return; }
  const t = e.target.closest("[data-track]"); if (t) { setSquad(+t.dataset.track); return; }
  const r = e.target.closest("#rail button"); if (r) { const el = document.getElementById(CH[+r.dataset.ch].id); scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: "auto" }); return; }
  if (e.target === sheet || e.target.closest("#sx")) closeSheet();
  if (e.target.closest("#drawer a, #drawer button")) setDrawer(false);
});
addEventListener("keydown", (e) => { if (e.key === "Escape") { closeSheet(); if (drawer.classList.contains("open")) setDrawer(false); } });
renderSquad();

// ---- countdown --------------------------------------------------------------
const pad = (n) => String(n).padStart(2, "0");
setInterval(function tick() {
  const s = Math.max(0, Math.floor((new Date(CONFIG.startsAt) - Date.now()) / 1000));
  $("#t-d").textContent = pad(Math.floor(s / 86400)); $("#t-h").textContent = pad(Math.floor((s % 86400) / 3600));
  $("#t-m").textContent = pad(Math.floor((s % 3600) / 60)); $("#t-s").textContent = pad(s % 60); return tick;
}(), 1000);

export { CONFIG, $, $$, ROOT, CH, TRACKS, Game, bootT0, loadout, show, boot, showError, failWorld, enter, setSquad, pad, track };
