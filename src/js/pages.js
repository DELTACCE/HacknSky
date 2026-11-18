import { downloadIcs } from "./calendar.js";
import { share } from "./share.js";
import { mountRegistration } from "./form.js";
import { track } from "./telemetry.js";
track("page_view", { path: location.pathname });
document.querySelector("[data-ics]")?.addEventListener("click", () => { downloadIcs(); track("add_to_calendar"); });
document.querySelector("[data-share]")?.addEventListener("click", async (e) => { const r = await share({ title: "HacknSky", text: "HacknSky is the first flagship event of DELTA, the Data Science Association, and part of DATARA '27, its fest at Christ College of Engineering, Irinjalakuda. Explore the proposed schedule." }); e.target.textContent = r === "copied" ? "Link copied" : "Share"; });
const m = document.getElementById("reg-mount"); if (m) mountRegistration(m);
