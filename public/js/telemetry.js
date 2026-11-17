// Anonymous, cookie-free usage and performance events. Off unless CONFIG.analyticsEndpoint is set; also off for Do Not Track / Global Privacy Control.
import { CONFIG } from "./config.js";

const optOut = navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true;
let sid = "x";
try { sid = sessionStorage.getItem("hns-sid") || (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); sessionStorage.setItem("hns-sid", sid); } catch (e) { /* storage blocked */ }

export function track(event, props = {}) {
  if (!CONFIG.analyticsEndpoint || optOut) return;
  const body = JSON.stringify({ type: "event", event, props, path: location.pathname, sid, t: Date.now(), vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio, mem: navigator.deviceMemory || null, cores: navigator.hardwareConcurrency || null });
  try {
    if (!(navigator.sendBeacon && navigator.sendBeacon(CONFIG.analyticsEndpoint, new Blob([body], { type: "text/plain" })))) fetch(CONFIG.analyticsEndpoint, { method: "POST", body, keepalive: true, mode: "no-cors", headers: { "Content-Type": "text/plain" } });
  } catch (e) { /* never break the page for analytics */ }
}

addEventListener("error", (e) => track("js_error", { msg: String(e.message).slice(0, 200), src: String(e.filename || "").split("/").pop(), line: e.lineno }));
addEventListener("unhandledrejection", (e) => track("js_error", { msg: String((e.reason && e.reason.message) || e.reason).slice(0, 200) }));
