// Registration form, shared by the 3D page's briefing sheet and the standalone /register/ page.
import { CONFIG, TRACKS } from "./config.js";
import { track } from "./telemetry.js";
import { downloadIcs } from "./calendar.js";
import { share } from "./share.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
try { localStorage.removeItem("hns-reg-draft"); } catch { /* storage unavailable */ }
const STATUS = {
  open: "Registrations are open.", soon: "Registrations open soon. Leave your details and we will write to you first.",
  waitlist: "The list is full. Join the waitlist and we will write if a place opens.", closed: "Registrations are closed.",
};

export function mountRegistration(mount, { squad = -1 } = {}) {
  const base = mount.dataset.base || "", st = CONFIG.registration.status in STATUS ? CONFIG.registration.status : "soon", closed = st === "closed";
  const dl = CONFIG.registration.deadline ? ` Deadline: ${esc(CONFIG.registration.deadline)}.` : "";
  if (closed || st === "soon" || !(CONFIG.formEndpoint || CONFIG.registerUrl)) {
    mount.innerHTML = `<p class="reg-status"><b>${closed ? "Registration is closed." : "Registration opens soon."}</b> We are not collecting applications right now.</p><p><a href="${base}guide/">Read the participant guide</a></p>`;
    return;
  }
  if (CONFIG.registerUrl) { mount.innerHTML = `<a class="btn" href="${esc(CONFIG.registerUrl)}">Register</a>`; return; }
  mount.innerHTML = `
  <form id="reg" class="reg" novalidate>
    <p class="reg-status" data-st="${st}">${STATUS[st]}${st === "open" || st === "waitlist" ? dl : ""}</p>
    <div class="row2"><label>Your name<input name="name" autocomplete="name" required></label><label>Email<input name="email" type="email" autocomplete="email" inputmode="email" required></label></div>
    <div class="row2"><label>College<input name="college" autocomplete="organization" required></label><label>Phone (optional)<input name="phone" type="tel" autocomplete="tel" inputmode="tel"></label></div>
    <div class="row2"><label>Year and department<input name="year" placeholder="e.g. 3rd year, CSE"></label><label>Track<select name="track" id="f-track"><option value="">Undecided</option>${TRACKS.map((t, i) => `<option value="${i}">${esc(t.k)}</option>`).join("")}</select></label></div>
    <label>Team name (optional)<input name="team"></label>
    <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label class="chk consent"><input type="checkbox" name="consent" required> I agree to the <a href="${base}privacy/" target="_blank" rel="noopener">privacy notice</a> and the <a href="${base}code-of-conduct/" target="_blank" rel="noopener">code of conduct</a>.</label>
    <button class="btn btn-lg" type="submit">Register <span aria-hidden="true">→</span></button>
    <div id="fmsg" role="status" aria-live="polite"></div>
  </form>`;
  const form = mount.querySelector("form"), msg = form.querySelector("#fmsg"), btn = form.querySelector("button[type=submit]"), t0 = Date.now();
  if (squad >= 0) form.track.value = String(squad);
  let started = false; form.addEventListener("focusin", () => { if (!started) { started = true; track("register_start"); } });

  const fail = (text, field) => { msg.className = "bad"; msg.textContent = text; if (field) field.focus(); btn.disabled = closed; return false; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); if (closed) return; const f = form.elements, v = (k) => String(f[k].value || "").trim(), mail = /^\S+@\S+\.\S+$/;
    if (v("name").length < 2) return fail("Please add your name.", f.name);
    if (!mail.test(v("email"))) return fail("Please add a valid email.", f.email);
    if (!v("college")) return fail("Please add your college.", f.college);
    if (!f.consent.checked) return fail("Please tick the box to continue.", f.consent);
    if (v("website")) return done(); // honeypot: pretend it worked
    if (Date.now() - t0 < 2500) return fail("That was quick. Please check the details and try again.");
    const data = { type: "registration", name: v("name"), email: v("email"), phone: v("phone"), college: v("college"), year: v("year"), track: TRACKS[f.track.value]?.k || "undecided", team: v("team"), consent: true, consentAt: new Date().toISOString(), source: location.pathname, status: st };
    btn.disabled = true; msg.className = ""; msg.textContent = "Sending…"; track("register_submit", { track: data.track });
    try {
      const gas = /script\.google\.com/.test(CONFIG.formEndpoint); // Apps Script needs a "simple" request to avoid a CORS preflight
      const r = await fetch(CONFIG.formEndpoint, { method: "POST", headers: { "Content-Type": gas ? "text/plain;charset=utf-8" : "application/json" }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => null);
      if (!r.ok || j?.ok !== true) return fail(j?.error || "We could not confirm your registration. Please try again.");
      track("register_ok"); done(data);
    } catch (err) { track("register_fail"); fail("Network error. Please try again."); }
  });

  function done(data) {
    const c = CONFIG.community && CONFIG.community.url ? `<a class="btn" href="${esc(CONFIG.community.url)}" target="_blank" rel="noopener">${esc(CONFIG.community.label || "Join the community")}</a>` : "";
    mount.innerHTML = `<div class="reg-done"><h3>You are on the list${data ? ", " + esc(data.name.split(" ")[0]) : ""}.</h3>
      <p>We will write when the dates, tracks and the ride are confirmed. Add the proposed dates to your calendar and tell your partner.</p>
      <div class="actions"><button class="btn" data-act="ics">Add to calendar</button><button class="btn btn-ghost" data-act="share">Share with a friend</button>${c}</div><p class="note" id="share-note" role="status"></p></div>`;
    mount.querySelector('[data-act="ics"]').onclick = downloadIcs;
    mount.querySelector('[data-act="share"]').onclick = async () => { const r = await share({ url: CONFIG.siteUrl }); mount.querySelector("#share-note").textContent = r === "copied" ? "Link copied." : ""; };
  }
}
