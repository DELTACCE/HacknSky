import { downloadIcs } from "./calendar.js";
import { share } from "./share.js";
import { mountRegistration } from "./form.js";
import { track } from "./telemetry.js";
import { CONFIG } from "./config.js";
track("page_view", { path: location.pathname });
document.querySelector("[data-ics]")?.addEventListener("click", () => { downloadIcs(); track("add_to_calendar"); });
document.querySelector("[data-share]")?.addEventListener("click", async (e) => { const r = await share({ title: "HacknSky", text: "HacknSky: a hackathon at Athirappilly Falls", url: CONFIG.siteUrl }); e.target.textContent = r === "copied" ? "Link copied" : "Share"; });
const m = document.getElementById("reg-mount"); if (m) mountRegistration(m);
