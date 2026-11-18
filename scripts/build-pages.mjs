// Generates the static info pages from data/event.json. Run: node scripts/build-pages.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const repo = join(dirname(fileURLToPath(import.meta.url)), ".."), root = join(repo, "src"); // generated pages go to src/ so Vite bundles them
const E = JSON.parse(readFileSync(join(repo, "data/event.json"), "utf8"));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const draft = (t = "Draft") => `<span class="badge">${t}</span>`;
const NAV = [["schedule", "Schedule"], ["prizes", "Prizes"], ["rules", "Rules"], ["faq", "FAQ"], ["venue", "Venue"], ["team", "Team"], ["sponsors", "Sponsors"], ["contact", "Contact"]];
const identity = `The first flagship hackathon of ${E.organiser} at Christ College of Engineering, Irinjalakuda.`;

const PAGES = {
  schedule: { title: "Schedule", lead: `${E.dates.label} · ${E.venue.name} ${draft("Proposed")}`, body: () =>
    E.schedule.map((d) => `<h2>${esc(d.day)}</h2><ol class="tl">${d.items.map((i) => `<li><time>${esc(i.time)}</time><span>${esc(i.what)}</span></li>`).join("")}</ol>`).join("") +
    `<h2>Road to the sprint</h2><ol class="tl">${E.milestones.map((m) => `<li><time>${esc(m.when)}</time><span><b>${esc(m.title)}.</b> ${esc(m.text)}</span></li>`).join("")}</ol>` +
    `<p><button class="btn" data-ics>Add to calendar</button> <button class="btn ghost" data-share>Share</button></p>` },
  prizes: { title: "Prizes", lead: `The awards programme ${draft("Planned")}`, body: () =>
    `<div class="cards">${E.prizes.map((p) => `<div class="card"><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div>`).join("")}</div><p class="tbc">The prize pool and individual award amounts are not yet confirmed.</p>` +
    `<h2>How teams are judged ${draft()}</h2><table><thead><tr><th>Criterion</th><th>Weight</th><th>What we look for</th></tr></thead><tbody>${E.judging.map((j) => `<tr><td>${esc(j.name)}</td><td>${j.weight}%</td><td>${esc(j.text)}</td></tr>`).join("")}</tbody></table>` },
  rules: { title: "Rules", lead: `${draft()} Final rules are due before the open call.`, body: () =>
    E.rules.map((r) => `<h2>${esc(r.h)}</h2><ul>${r.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`).join("") + `<p>See also the <a href="../code-of-conduct/">code of conduct</a>.</p>` },
  faq: { title: "FAQ", lead: "What student teams need to know about selection, travel and the overnight build.", body: () =>
    E.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("") },
  venue: { title: "Venue", lead: `${esc(E.venue.name)} ${draft("Proposed")}`, body: () =>
    `<ul>${E.venue_notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul><p><a class="btn ghost" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${E.venue.lat}&amp;mlon=${E.venue.lng}#map=11/${E.venue.lat}/${E.venue.lng}">Open map</a></p>` +
    `<p class="tbc">Travel and stay details for outside teams are to be confirmed. Do not book non-refundable travel until the organisers confirm the dates.</p>` },
  team: { title: "Team", lead: "Organisers, faculty, judges and mentors", body: () =>
    `<p>${esc(E.organiser)} organises HacknSky. ${esc(E.institution)}.</p>` + (Object.values(E.people).some((group) => group.length) ? Object.entries(E.people).filter(([, group]) => group.length).map(([k, group]) => `<h2>${esc(k[0].toUpperCase() + k.slice(1))}</h2><div class="cards">${group.map((p) => `<div class="card"><h3>${esc(p.name)}</h3><p>${esc(p.role || "")}</p></div>`).join("")}</div>`).join("") : `<p class="tbc">The individual organisers, faculty members, judges, mentors and speakers have not yet been announced.</p>`) },
  sponsors: { title: "Sponsors", lead: "Proposed partnership opportunities", body: () =>
    `<div class="cards">${E.sponsors.tiers.map((t) => `<div class="card"><h3>${esc(t.name)}</h3><p>${t.slots ? `${t.slots} proposed partnership${t.slots > 1 ? "s" : ""}.` : "For groups interested in supporting the event."}</p></div>`).join("")}</div><p>For partnership enquiries, see the <a href="../contact/">organiser contact page</a>.</p>` },
  contact: { title: "Contact", lead: "Reach the organisers", body: () =>
    (E.contact.email ? `<p>Email: <a href="mailto:${esc(E.contact.email)}">${esc(E.contact.email)}</a></p>` : `<p class="tbc">DELTA has not yet published a contact address for HacknSky. The <a href="../faq/">FAQ</a> covers eligibility, travel and accommodation.</p>`) },
  register: { title: "Register", lead: "Express interest as a team of two or request help finding a partner.", body: () => `<div id="reg-mount" data-base="../"></div>`, reg: true },
  privacy: { title: "Privacy notice", lead: `${draft()} Pending institutional review.`, body: () => `
    <h2>What we collect</h2><p>Only what the registration form asks for: name, email, college, phone (optional), year, track preference, team details.</p>
    <h2>Why</h2><p>To run selection, contact you about the event, arrange travel and safety, and tell you about changes.</p>
    <h2>Who sees it</h2><p>The organising team and the institution’s staff who help run the event. We do not sell data.</p>
    <h2>Analytics</h2><p>If enabled, we count page views and performance without cookies. We respect Do Not Track and Global Privacy Control.</p>
    <h2>Your rights</h2><p>You can ask to see, correct or delete your data through the contact page.</p>
    <h2>Retention</h2><p>Registration data is deleted after the event unless you agree to hear about future editions.</p>` },
  terms: { title: "Terms of participation", lead: `${draft()} Pending institutional review.`, body: () => `<p>By registering you agree to the <a href="../rules/">rules</a>, the <a href="../code-of-conduct/">code of conduct</a> and the <a href="../privacy/">privacy notice</a>. Dates, venue and programme are proposed and may change. Participation is subject to selection and to safety rules at the venue.</p>` },
  "code-of-conduct": { title: "Code of conduct", lead: `${draft()} Participant conduct and safety`, body: () => `<p>HacknSky is for everyone to build and learn safely.</p><ul><li>Be respectful. No harassment, discrimination or intimidation.</li><li>Credit other people’s work and respect the rules.</li><li>Look after the place: leave no litter and stay clear of restricted areas.</li><li>Follow staff instructions, especially around water and heights.</li><li>Report concerns to any organiser. Anyone breaking the code may be asked to leave.</li></ul>` },
  past: { title: "Past editions", lead: "The inaugural edition", body: () => `<p>The first HacknSky is proposed for ${esc(E.dates.label)}. There are no previous editions. See the <a href="../schedule/">proposed schedule</a> for this edition.</p>` },
};

const shell = (slug, p) => {
  const depth = "../", url = `${E.siteUrl}${slug}/`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)} | HacknSky · DATARA ’27</title><meta name="description" content="${esc(p.title)} for HacknSky at ${esc(E.fest)}. Proposed hackathon dates and venue: ${esc(E.dates.label)}, ${esc(E.venue.name)}.">
<link rel="canonical" href="${url}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${depth}css/pages.css">
<meta property="og:title" content="${esc(p.title)} · HacknSky"><meta property="og:image" content="${E.siteUrl}assets/og.png"></head><body>
<a class="skip" href="#main">Skip to content</a>
<header><a class="brand" href="${depth}"><img src="/assets/hacknsky-lockup.webp" width="950" height="417" alt="HacknSky home"></a><nav aria-label="Pages">${NAV.map(([s, n]) => `<a href="${depth}${s}/"${s === slug ? ' aria-current="page"' : ""}>${n}</a>`).join("")}<a class="btn" href="${depth}register/">Register</a></nav></header>
<main id="main" tabindex="-1"><h1>${esc(p.title)}</h1><p class="lead">${p.lead}</p>${p.body()}</main>
<footer class="event-footer"><div class="footer-inner"><div><img class="footer-event" src="/assets/hacknsky-lockup.webp" width="950" height="417" alt="HacknSky" loading="lazy"><p>${esc(identity)}</p></div><div><span>Part of the fest</span><img class="footer-fest" src="/assets/datara-27-lockup.webp" width="1156" height="369" alt="DATARA ’27" loading="lazy"></div><div><span>In official collaboration with</span><strong>Silver Storm</strong></div><div class="footer-links"><a href="${depth}privacy/">Privacy</a><a href="${depth}terms/">Terms</a><a href="${depth}code-of-conduct/">Code of conduct</a><a href="${depth}past/">Past editions</a></div></div></footer>
<script type="module" src="${depth}js/pages.js"></script></body></html>`;
};

for (const [slug, p] of Object.entries(PAGES)) { mkdirSync(join(root, slug), { recursive: true }); writeFileSync(join(root, slug, "index.html"), shell(slug, p)); }
const urls = ["", ...Object.keys(PAGES)].map((s) => `<url><loc>${E.siteUrl}${s ? s + "/" : ""}</loc></url>`).join("");
writeFileSync(join(repo, "public", "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`);
console.log("built", Object.keys(PAGES).length, "pages + sitemap");
