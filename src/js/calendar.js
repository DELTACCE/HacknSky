// "Add to calendar": builds a .ics file in the browser from CONFIG, so dates only live in one place.
import { CONFIG } from "./config.js";

const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function icsText() {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HacknSky//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", "UID:hacknsky-2027@" + (new URL(CONFIG.siteUrl).hostname),
    "DTSTAMP:" + stamp(Date.now()), "DTSTART:" + stamp(CONFIG.startsAt), "DTEND:" + stamp(CONFIG.endsAt),
    "SUMMARY:" + esc("HacknSky (proposed dates)"), "LOCATION:" + esc("Athirappilly, Kerala"),
    "DESCRIPTION:" + esc("A two-day destination hackathon. Dates and venue are proposed and subject to confirmation. " + CONFIG.siteUrl),
    "URL:" + CONFIG.siteUrl, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}

export function downloadIcs() {
  const url = URL.createObjectURL(new Blob([icsText()], { type: "text/calendar;charset=utf-8" })), a = document.createElement("a");
  a.href = url; a.download = "hacknsky.ics"; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
}
