// Single place to edit event details. Values marked "placeholder" should be
// replaced before launch. Every claim that is not confirmed is labelled as
// proposed in the UI.
export const EVENT = {
  name: "HacknSky",
  wordmark: "HacknSky",
  tagline: "Less ordinary. More altitude.",
  subtitle: "Build ideas. Defy gravity.",
  lead: "Two days in Athirappilly. Forty students. One shared mountain, and a ride down worth building for.",
  // Proposed dates (IST). Change once confirmed.
  startsAt: "2027-01-15T09:00:00+05:30",
  dateLabel: "15–16 Jan 2027",
  location: "Athirappilly, Kerala",
  coordinates: "10.28°N 76.57°E",
  organiser: "DELTA",
  edition: "DATARA’27",
  institution: "Christ College of Engineering (Autonomous)",
  department: "Dept. of CSE (Data Science)",
  status: "Proposed event. Dates, venue, tracks and the ride are subject to confirmation.",
  // Optional external registration page (Devfolio, Google Form, ...). When set,
  // every Register CTA links there and the in-page form is hidden.
  registerUrl: process.env.NEXT_PUBLIC_REGISTER_URL || "",
  // Optional POST endpoint that accepts the JSON registration payload. Until it
  // is set the form validates but says plainly that nothing was sent.
  formEndpoint: process.env.NEXT_PUBLIC_FORM_ENDPOINT || "",
  // Optional contact address. Leave empty until a monitored inbox exists.
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
};

export const NAV_LINKS = [
  { href: "#destination", label: "Destination" },
  { href: "#experience", label: "Experience" },
  { href: "#hackathon", label: "Tracks" },
  { href: "#timeline", label: "Timeline" },
  { href: "#playground", label: "Playground" },
  { href: "#map", label: "Map" },
  { href: "#competition", label: "Awards" },
];
