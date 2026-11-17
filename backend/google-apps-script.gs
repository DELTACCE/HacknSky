/**
 * HacknSky registration receiver (Google Apps Script). UNTESTED against a live deployment.
 * Setup: create a Google Sheet, Extensions > Apps Script, paste this, Deploy > Web app
 * (Execute as: me, Access: anyone). Put the /exec URL in js/config.js as formEndpoint.
 * The site POSTs text/plain JSON to avoid a CORS preflight.
 */
const SHEET = "Registrations", HEADERS = ["time", "name", "email", "college", "phone", "year", "track", "team", "partnerName", "partnerEmail", "needPartner", "event"];
const SEND_CONFIRMATION = true, ORGANISER_NAME = "HacknSky team";

function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || "{}");
    if (d.website) return out({ ok: true });                 // honeypot filled: pretend success
    const email = String(d.email || "").trim().toLowerCase();
    if (!d.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return out({ ok: false, error: "invalid" });
    const sh = sheet();
    const emails = sh.getRange(2, 3, Math.max(sh.getLastRow() - 1, 1), 1).getValues().flat();
    if (emails.indexOf(email) !== -1) return out({ ok: true, duplicate: true }); // one row per email
    sh.appendRow([new Date(), d.name, email, d.college, d.phone, d.year, d.track, d.team, d.partnerName, d.partnerEmail, d.needPartner ? "yes" : "", "HacknSky 2027"]);
    if (SEND_CONFIRMATION) MailApp.sendEmail(email, "HacknSky: we got your details",
      "Hi " + d.name + ",\n\nThanks for registering interest in HacknSky. Dates, venue and selection are still proposed; we will write to you with updates.\n\n" + ORGANISER_NAME);
    return out({ ok: true });
  } catch (err) { return out({ ok: false, error: String(err) }); } finally { lock.releaseLock(); }
}
function sheet() { const ss = SpreadsheetApp.getActive(); let s = ss.getSheetByName(SHEET); if (!s) { s = ss.insertSheet(SHEET); s.appendRow(HEADERS); } return s; }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
