// Share via the phone's share sheet when available, otherwise copy the link.
export async function share(data = {}) {
  const payload = { title: data.title || "HacknSky", text: data.text || "A destination hackathon at Athirappilly Falls.", url: data.url || location.origin + location.pathname };
  try { if (navigator.share) { await navigator.share(payload); return "shared"; } } catch (e) { if (e && e.name === "AbortError") return "cancelled"; }
  try { await navigator.clipboard.writeText(payload.url); return "copied"; } catch (e) { return "failed"; }
}
