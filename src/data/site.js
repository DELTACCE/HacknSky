/**
 * Central site configuration and event facts.
 * Everything marked `proposed` is NOT confirmed and must stay labelled as such in the UI.
 */

/** Runtime configuration. Set the VITE_* variables in a `.env` file (see `.env.example`). */
export const CONFIG = {
  /** External registration page (e.g. a form service). When set, all "Join" CTAs open it. */
  applyUrl: import.meta.env.VITE_APPLY_URL || '',
  /** POST endpoint that accepts the JSON registration payload. Form stays closed until set. */
  formEndpoint: import.meta.env.VITE_FORM_ENDPOINT || '',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || '',
};

export const SITE = {
  name: 'HACKnSKY',
  tagline: 'A destination-based innovation hackathon',
  description:
    'HACKnSKY: a proposed two-day destination hackathon by DELTA as part of DATARA’27, Christ College of Engineering.',
  organiser: 'DELTA',
  edition: 'DATARA’27',
  institution: 'Christ College of Engineering (Autonomous)',
  department: 'Dept. of CSE (Data Science)',
  location: 'Athirappilly, Kerala',
  coordinates: '10.28°N 76.57°E',
  plannedDates: '15–16 January 2027',
  status: 'proposed',
  proposedNotice: 'Proposed event. Final dates and venue to be confirmed.',
};

export const NAV_LINKS = [
  { to: '/about', label: 'The experience' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/tracks', label: 'Tracks' },
  { to: '/sponsors', label: 'Sponsors' },
];

export const EXPLORE_LINKS = [
  { to: '/about', title: 'About', text: 'The concept, the ride and the FAQ.' },
  { to: '/timeline', title: 'Timeline', text: 'From campus briefing to the ride down.' },
  { to: '/tracks', title: 'Tracks', text: 'Challenge tracks and mentors.' },
  { to: '/sponsors', title: 'Sponsors', text: 'Awards, partners and institutions.' },
  { to: '/register', title: 'Register', text: 'Team applications and enquiries.' },
];
