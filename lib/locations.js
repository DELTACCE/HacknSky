// Map points of interest, without any 3D maths so the page bundle stays light.
// Ids match the building pads in lib/world.js, which supply x / z.
export const LOCATION_INFO = [
  {
    id: "venue",
    short: "Venue",
    name: "Hackathon Venue",
    note: "Main hall, build floor and mentor desks beside the river.",
    color: "#b8f04a",
    lift: 8,
  },
  {
    id: "stationA",
    short: "West Station",
    name: "Cable Car · West Station",
    note: "Board here. The ride across the valley starts at the west station.",
    color: "#f6f2e8",
    lift: 11,
  },
  {
    id: "stationB",
    short: "East Station",
    name: "Cable Car · East Station",
    note: "The arrival station: finals stage and the sunset demo deck.",
    color: "#f6f2e8",
    lift: 11,
  },
  {
    id: "waterpark",
    short: "Water Park",
    name: "Water Park",
    note: "Slides, a wave pool and a lazy river for the recharge breaks.",
    color: "#69c4e2",
    lift: 9,
  },
  {
    id: "falls",
    short: "Falls",
    name: "Waterfall Viewpoint",
    note: "A short walk to the foot of the falls. Best at sunrise.",
    color: "#ffffff",
    lift: 6,
  },
];
