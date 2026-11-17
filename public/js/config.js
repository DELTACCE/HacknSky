// The only file organisers need to edit for launch. No build step: change a value, redeploy.
export const CONFIG = {
  startsAt: "2027-01-15T09:00:00+05:30",
  endsAt: "2027-01-16T18:00:00+05:30",
  registration: { status: "soon", deadline: "" }, // "open" | "soon" | "waitlist" | "closed"
  registerUrl: "",        // an external form (Devfolio, Google Form…): the form becomes a redirect
  formEndpoint: "",       // or a POST endpoint for JSON registrations (see backend/google-apps-script.gs)
  analyticsEndpoint: "",  // optional: receives anonymous events and real-phone performance numbers
  contactEmail: "",       // shown on Contact and used as the fallback when the form is not connected
  community: { label: "", url: "" }, // e.g. { label: "Join the WhatsApp group", url: "https://chat.whatsapp.com/…" }
  siteUrl: "https://example.com/",
};

export const TRACKS = [
  { k: "Sky", tag: "Drones, mapping, aerial data", ask: "Map a forest canopy without ever touching it.", ideas: ["Canopy maps from drone photos", "Landing-spot finder for rescue drones", "Cloud and light forecasts for farmers"], col: "#5ec2ff",
    ico: '<path d="M3 17 21 4l-4 16-5-6z"/><path d="m12 14-1 5"/>' },
  { k: "Canopy", tag: "Climate, forests, biodiversity", ask: "Make a hornbill count itself, passively and cheaply.", ideas: ["Bird-call counter on a tiny chip", "Tree-health score from leaf photos", "Trail-camera species logger"], col: "#4bd17a",
    ico: '<path d="m12 3-6 8h3l-4 6h14l-4-6h3z"/><path d="M12 17v4"/>' },
  { k: "River", tag: "Water, energy, flood resilience", ask: "Warn a village before the river rises, using only what is nearby.", ideas: ["Flood early-warning for villages", "Micro-hydro output predictor", "Live water-quality dashboard"], col: "#27d1d8",
    ico: '<path d="M2 8c3-3 5 3 8 0s5 3 8 0 3-1 4-1"/><path d="M2 14c3-3 5 3 8 0s5 3 8 0 3-1 4-1"/><path d="M2 20c3-3 5 3 8 0s5 3 8 0 3-1 4-1"/>' },
  { k: "Summit", tag: "Open track. Anything bold.", ask: "Build the thing you would be proud to demo on a cable car.", ideas: ["Anything bold, shipped as a demo", "A tool for the next hackathon", "Your own idea, judged on impact"], col: "#c6f04e",
    ico: '<path d="M2 20 9 6l4 7 3-4 6 11z"/>' },
];
