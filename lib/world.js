import { Vector3 } from "three";
import { clamp, fbm, lerp, smoothstep } from "./noise";
import { LOCATION_INFO } from "./locations";

// ---------------------------------------------------------------------------
// The shared "world" definition. Every 3D component (hero scene, event map)
// samples the same height function so rivers, trees and cables line up.
//   x: left/right   y: up   z: toward the camera (river flows toward +z)
// ---------------------------------------------------------------------------

export const TERRAIN = {
  width: 150, // x in [-75, 75]
  depth: 110, // z in [-80, 30]
  centerX: 0,
  centerZ: -25,
  segW: 74,
  segD: 54,
};

export const FALL_CENTER = -24.5; // z of the waterfall cliff

export function riverX(z) {
  return 2.5 * Math.sin(z * 0.14 + 0.6);
}

// --- cable car layout (needed by the pads below) ---------------------------
export const CABLE_Z = -2;
export const LANE_GAP = 2.4;
const A_X = -22;
const B_X = 22;
const CABLE_TOP = 7;

// Flat building pads: terrain is blended toward one height so landmarks sit
// on level ground. `h` defaults to the natural height at the pad centre.
export const PADS = [
  { id: "venue", x: -11, z: 7, r: 6, blend: 4 },
  { id: "waterpark", x: 16, z: 10, r: 7, blend: 4 },
  { id: "falls", x: 7, z: -15, r: 2.6, blend: 3 },
  { id: "stationA", x: A_X, z: CABLE_Z - LANE_GAP / 2, r: 4, blend: 4 },
  { id: "stationB", x: B_X, z: CABLE_Z - LANE_GAP / 2, r: 4, blend: 4 },
];

function terrainBase(x, z) {
  const d = Math.abs(x - riverX(z));
  const valley = smoothstep(2.5, 24, d);
  const n = fbm(x * 0.045 + 10, z * 0.045 + 3);

  // rolling hills that rise away from the river
  let h = valley * (3 + 12 * n);

  // big ranges on both sides of the valley
  const side = smoothstep(24, 55, Math.abs(x));
  h += side * (8 + 14 * fbm(x * 0.03 + 4, z * 0.03 + 50));

  // the cliff / plateau the waterfall drops from
  const s = clamp((-z - 23) / 3, 0, 1);
  const cliff = s * s * (3 - 2 * s);
  const top = 15 + valley * 5 * n + side * 7;
  return lerp(h, top, cliff);
}

const padCache = new Map();
export function padHeightOf(id) {
  if (!padCache.has(id)) {
    const p = PADS.find((q) => q.id === id);
    padCache.set(id, p.h !== undefined ? p.h : terrainBase(p.x, p.z));
  }
  return padCache.get(id);
}

export function heightAt(x, z) {
  let h = terrainBase(x, z);
  for (let i = 0; i < PADS.length; i++) {
    const p = PADS[i];
    const t = 1 - smoothstep(p.r, p.r + p.blend, Math.hypot(x - p.x, z - p.z));
    if (t > 0) h = lerp(h, padHeightOf(p.id), t);
  }
  // carve the river channel last so pads never fill it in
  const d = Math.abs(x - riverX(z));
  h -= (1 - smoothstep(1.2, 3.4, d)) * 1.3;
  return h;
}

export function slopeAt(x, z) {
  const h = heightAt(x, z);
  return Math.max(
    Math.abs(heightAt(x + 1.2, z) - h),
    Math.abs(heightAt(x, z + 1.2) - h)
  );
}

// True where trees must not grow: river corridor, pads, cable lanes.
export function isReserved(x, z) {
  if (Math.abs(x - riverX(z)) < 4.8) return true;
  // keep the cable right-of-way clear so cabins never pass through treetops
  if (x > A_X - 5 && x < B_X + 5 && Math.abs(z - (CABLE_Z - LANE_GAP / 2)) < 3.6) {
    return true;
  }
  for (const p of PADS) {
    if (Math.hypot(x - p.x, z - p.z) < p.r + p.blend * 0.6) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Cable car
// ---------------------------------------------------------------------------

export const CABLE = {
  a: new Vector3(A_X, padHeightOf("stationA") + CABLE_TOP, CABLE_Z),
  b: new Vector3(B_X, padHeightOf("stationB") + CABLE_TOP, CABLE_Z),
  groundA: padHeightOf("stationA"),
  groundB: padHeightOf("stationB"),
  sag: 3.2,
};

export function cablePoint(t, lane = 0, out = new Vector3()) {
  const { a, b, sag } = CABLE;
  return out.set(
    lerp(a.x, b.x, t),
    lerp(a.y, b.y, t) - sag * 4 * t * (1 - t),
    lerp(a.z, b.z, t) - lane * LANE_GAP
  );
}

// Cabin position along its cable for a journey progress p (0..1, = stage / 3).
// Slow drift through the hero and destination, then a long visible ride while
// the cable-car section is pinned (stage 2 -> 2.7). A tiny idle sway keeps it
// from ever looking frozen.
const CAR_KEYS = [
  [0, 0.15],
  [1 / 3, 0.3],
  [2 / 3, 0.42],
  [0.9, 0.9],
  [1, 0.9],
];
export function carT(p, time = 0) {
  let i = 0;
  while (i < CAR_KEYS.length - 2 && p > CAR_KEYS[i + 1][0]) i++;
  const [p0, t0] = CAR_KEYS[i];
  const [p1, t1] = CAR_KEYS[i + 1];
  const k = clamp((p - p0) / (p1 - p0), 0, 1);
  return clamp(lerp(t0, t1, k) + 0.012 * Math.sin(time * 0.4), 0.04, 0.96);
}

// ---------------------------------------------------------------------------
// Points of interest used by the event map
// ---------------------------------------------------------------------------

export const LOCATIONS = LOCATION_INFO.map((info) => {
  const p = PADS.find((q) => q.id === info.id);
  return { ...info, x: p.x, z: p.z };
});

export function locationY(loc) {
  const pad = PADS.find((p) => p.id === loc.id);
  return pad ? padHeightOf(pad.id) : heightAt(loc.x, loc.z);
}
