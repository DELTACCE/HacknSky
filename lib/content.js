// All copy that is event-specific lives here so it is easy to replace.
// Everything below is PROPOSED content: dates, prizes, mentors, judges and the
// ride must be confirmed before they are presented as fact.

export const FACTS = [
  { value: "~24 m", label: "The falls drop" },
  { value: "20", label: "Proposed teams" },
  { value: "02", label: "Students per team" },
];

export const ARRIVAL_BEATS = [
  { time: "06:30", text: "Buses leave Christ College, Irinjalakuda" },
  { time: "07:40", text: "Base-camp check-in, badges, beds" },
  { time: "08:30", text: "Chai, site map, team tables" },
];

export const CABLE_POINTS = [
  "Two cabins, one valley. They pass each other mid-span.",
  "Teams ride out together: the build site sits above the treeline.",
  "Finals are pitched from the east station at sunset.",
  "The ride is proposed for finalist teams, subject to operational confirmation.",
];

// The scroll journey, told again as a vertical story. Times are indicative.
export const STORY = [
  {
    n: "01",
    time: "DAY 1 · 07:40",
    title: "The valley meets you first.",
    text: "Buses pull out of Irinjalakuda before the mist lifts. Athirappilly wakes up slow: river on one side, Western Ghats on the other, and forty people who came here to build.",
    beats: ARRIVAL_BEATS,
  },
  {
    n: "02",
    time: "DAY 1 · 10:00",
    title: "Drop your bag. Pick a problem.",
    text: "The brief lands at ten. Twenty teams of two, one shared floor, mentors already circulating, and challenge tracks announced live in the room.",
    facts: [
      { value: "20", label: "proposed teams" },
      { value: "02", label: "students per team" },
      { value: "05", label: "finalist shortlist" },
    ],
  },
  {
    n: "03",
    time: "DAY 1 · 13:00",
    title: "Heads down. Hands on it.",
    text: "Build sprints through the afternoon: prototype, test, tear it down, repeat. Mentors rotate table to table. Somewhere past the second round, the valley disappears behind your screen.",
    beats: [
      { time: "13:00", text: "Build sprint one opens" },
      { time: "16:00", text: "Mentor rounds, track check-ins" },
      { time: "19:00", text: "Dinner, then the second wind" },
    ],
  },
  {
    n: "04",
    time: "OVERNIGHT · 22:00",
    title: "The hours that separate ideas.",
    text: "Debug by headlamp. Chai at two. Your teammate takes the shift. Outside, the valley goes quiet; inside, the build gets loud, and an idea you sketched at lunch finally runs.",
    beats: [
      { time: "22:00", text: "Room quietens, real work starts" },
      { time: "02:00", text: "Mentor on call, second review" },
      { time: "06:00", text: "Code freeze, demo prep" },
    ],
  },
  {
    n: "05",
    time: "DAY 2 · 10:00",
    title: "Five minutes. One shot to land it.",
    text: "Demo to the room, no slides longer than the timer. Judges score impact, originality and execution. Five teams advance to the finale.",
    beats: [
      { time: "10:00", text: "Teams demo, six minutes each" },
      { time: "13:00", text: "Jury deliberation" },
      { time: "15:00", text: "Five finalists announced" },
    ],
  },
  {
    n: "06",
    time: "DAY 2 · 16:00",
    title: "Five teams. One last ride.",
    text: "Finalists take the Sky Storm line back down with the award in hand. Everyone else leaves with a working prototype and a much better story.",
  },
];

export const TRACKS = [
  {
    glyph: "sky",
    name: "Sky",
    blurb: "Drones, mapping and aerial data.",
    challenge: "Map a forest canopy without ever touching it.",
  },
  {
    glyph: "canopy",
    name: "Canopy",
    blurb: "Climate, forests and biodiversity.",
    challenge: "Make a hornbill count itself, passively and cheaply.",
  },
  {
    glyph: "river",
    name: "River",
    blurb: "Water, energy and flood resilience.",
    challenge: "Warn a village before the river rises, using only what is nearby.",
  },
  {
    glyph: "summit",
    name: "Summit",
    blurb: "Open track. Anything bold.",
    challenge: "Build the thing you would be proud to demo on a cable car.",
  },
];

export const ROUTE_STAGES = [
  {
    time: "DECEMBER 2026",
    title: "Campus engagement",
    text: "DATARA’27 is introduced on campus and five teams are selected at Christ College of Engineering.",
  },
  {
    time: "DEC 2026 – EARLY JAN 2027",
    title: "Open participation",
    text: "Applications open to other institutions; fifteen further teams are chosen through a defined evaluation.",
  },
  {
    time: "15–16 JANUARY 2027",
    title: "Destination hackathon",
    text: "Twenty teams of two arrive at Athirappilly for the overnight sprint, mentoring and judging.",
  },
  {
    time: "DAY TWO · 15:00",
    title: "Finale and recognition",
    text: "Five finalists showcase, awards follow, and the Sky Storm ride is proposed, subject to availability.",
  },
];

export const DAY_PLAN = [
  {
    day: "DAY 1",
    title: "Arrival",
    items: [
      { time: "06:30", text: "Buses from Christ College" },
      { time: "07:40", text: "Base camp check-in, badges, beds" },
      { time: "08:30", text: "Chai, map of the site, team tables" },
    ],
  },
  {
    day: "DAY 1",
    title: "Brief and tracks",
    items: [{ time: "10:00", text: "The brief lands; challenge tracks announced live in the room" }],
  },
  {
    day: "DAY 1",
    title: "The build",
    items: [
      { time: "13:00", text: "Build sprint one opens" },
      { time: "16:00", text: "Mentor rounds, track check-ins" },
      { time: "19:00", text: "Dinner, then the second wind" },
    ],
  },
  {
    day: "OVERNIGHT",
    title: "The hours that separate ideas",
    items: [
      { time: "22:00", text: "Room quietens, real work starts" },
      { time: "02:00", text: "Mentor on call, second review" },
      { time: "06:00", text: "Code freeze, demo prep" },
    ],
  },
  {
    day: "DAY 2",
    title: "The showcase",
    items: [
      { time: "10:00", text: "Teams demo, six minutes each" },
      { time: "13:00", text: "Jury deliberation" },
      { time: "15:00", text: "Five finalists announced" },
    ],
  },
  {
    day: "DAY 2",
    title: "The ride down",
    items: [
      { time: "16:00", text: "Finalists take the Sky Storm line back down (proposed, subject to availability)" },
    ],
  },
];

export const ACTIVITIES = [
  { glyph: "wave", name: "Wave pool", note: "Reset your head between commits." },
  { glyph: "slide", name: "Twin slides", note: "Lime or sky. Pick a side." },
  { glyph: "lazy", name: "Lazy river", note: "Debug while floating. We will not judge." },
  { glyph: "trek", name: "Falls trek", note: "A short walk to the foot of the falls." },
  { glyph: "sunset", name: "Sunset ride", note: "The last cabin of the day." },
  { glyph: "night", name: "Night build deck", note: "Lights, tea and quiet." },
];

// Nothing here is confirmed. No amounts or categories are invented.
export const AWARDS = [
  { label: "Overall winners", note: "Awards programme being planned." },
  { label: "Track awards", note: "Categories and amounts to be decided." },
  { label: "Special mentions", note: "To be announced with the jury." },
];

export const MENTORS = [
  "Systems & infrastructure",
  "Applied AI",
  "Hardware & drones",
  "Product & design",
];

export const JUDGES = ["Founders panel", "Research panel", "Industry panel"];

export const SPONSOR_SLOTS = [
  { tier: "Title partner", span: true },
  { tier: "Build partner" },
  { tier: "Build partner" },
  { tier: "Community partner" },
  { tier: "Community partner" },
  { tier: "Community partner" },
];

export const PARTNERS = [
  {
    label: "Organised by",
    value: "DELTA",
    note: "as part of DATARA’27",
  },
  {
    label: "Hosted at",
    value: "Christ College of Engineering",
    note: "Autonomous · Dept. of CSE (Data Science)",
  },
  {
    label: "Partners",
    value: "None confirmed",
    note: "Institutional and industry partners to be announced.",
  },
];

export const FAQ = [
  {
    q: "Who can apply?",
    a: "Teams of two students. Eligibility rules are being finalised; Christ College of Engineering students are selected on campus and other institutions apply openly.",
  },
  {
    q: "Are the dates and venue confirmed?",
    a: "No. 15–16 January 2027 at Athirappilly, Kerala is proposed and subject to final arrangements.",
  },
  { q: "Is there a fee?", a: "Not yet announced." },
  {
    q: "Is the cable-car ride guaranteed?",
    a: "No. The Sky Storm experience for finalists is proposed and depends on availability and operational confirmation.",
  },
  {
    q: "Is this an existing cableway?",
    a: "No. The cableway in this page is a conceptual visualisation.",
  },
  {
    q: "How do I partner or sponsor?",
    a: "Use the partnership enquiry option in the registration section. Sponsors, mentors and judges are not confirmed yet.",
  },
];
