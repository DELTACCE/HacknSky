import * as THREE from "three";
import { clamp, mulberry32, valueNoise } from "./noise";

// ---------------------------------------------------------------------------
// Terrain: a jittered grid turned into flat-shaded, per-face coloured triangles.
// ---------------------------------------------------------------------------

const STOPS = [
  [-1.5, "#d9ecb8"],
  [0.4, "#b9dd8f"],
  [4, "#8cc96a"],
  [9, "#5aa85a"],
  [15, "#2f7a4d"],
  [21, "#286447"],
  [27, "#9dbc9f"],
  [34, "#eef4e6"],
].map(([h, c]) => [h, new THREE.Color(c)]);

const ROCK = new THREE.Color("#a99b80");

export function terrainColor(h, ny, rnd, out = new THREE.Color()) {
  let i = 0;
  while (i < STOPS.length - 2 && h > STOPS[i + 1][0]) i++;
  const [h0, c0] = STOPS[i];
  const [h1, c1] = STOPS[i + 1];
  const t = clamp((h - h0) / (h1 - h0), 0, 1);
  out.copy(c0).lerp(c1, t);
  // steep faces read as bare rock (this is what gives the waterfall its cliff)
  const rock = clamp((0.62 - ny) / 0.25, 0, 1);
  out.lerp(ROCK, rock * 0.85);
  // per-face brightness jitter = the "low-poly" look
  const v = 0.92 + rnd * 0.16;
  out.multiplyScalar(v);
  return out;
}

export function buildTerrainGeometry({
  width,
  depth,
  centerX = 0,
  centerZ = 0,
  segW,
  segD,
  heightFn,
  seed = 7,
}) {
  const rand = mulberry32(seed);
  const cols = segW + 1;
  const rows = segD + 1;
  const cw = width / segW;
  const cd = depth / segD;
  const positions = new Float32Array(cols * rows * 3);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let x = centerX - width / 2 + i * cw;
      let z = centerZ - depth / 2 + j * cd;
      // jitter interior vertices so triangles feel hand-placed
      if (i > 0 && i < segW && j > 0 && j < segD) {
        x += (rand() - 0.5) * cw * 0.55;
        z += (rand() - 0.5) * cd * 0.55;
      }
      const k = (j * cols + i) * 3;
      positions[k] = x;
      positions[k + 1] = heightFn(x, z);
      positions[k + 2] = z;
    }
  }

  const indices = [];
  for (let j = 0; j < segD; j++) {
    for (let i = 0; i < segW; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      if ((i + j) % 2 === 0) {
        indices.push(a, c, b, b, c, d);
      } else {
        indices.push(a, c, d, a, d, b);
      }
    }
  }

  let geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();

  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let v = 0; v < pos.count; v += 3) {
    const h = (pos.getY(v) + pos.getY(v + 1) + pos.getY(v + 2)) / 3;
    const ny = nor.getY(v);
    terrainColor(h, ny, rand(), c);
    for (let k = 0; k < 3; k++) {
      const o = (v + k) * 3;
      colors[o] = c.r;
      colors[o + 1] = c.g;
      colors[o + 2] = c.b;
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

// ---------------------------------------------------------------------------
// Peaks: jittered cones coloured by altitude.
// ---------------------------------------------------------------------------

const PEAK_STOPS = [
  [0, "#2b6b4c"],
  [0.4, "#4c8a66"],
  [0.7, "#a9c4a6"],
  [0.88, "#e2ecdf"],
  [1, "#f8f5ec"],
].map(([h, c]) => [h, new THREE.Color(c)]);

export function buildPeakGeometry({
  radius,
  height,
  seed = 1,
  radial = 7,
  heightSegs = 4,
}) {
  let geo = new THREE.ConeGeometry(radius, height, radial, heightSegs, true);
  geo.translate(0, height / 2, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    if (y > height - 0.01) continue; // keep the apex sharp
    // noise keyed on position so duplicated seam vertices stay welded
    const jx = valueNoise(x * 0.35 + seed * 13, z * 0.35 + y * 0.2) - 0.5;
    const jz = valueNoise(z * 0.35 + seed * 7, x * 0.35 + y * 0.2) - 0.5;
    const jy = valueNoise(x * 0.5 + y * 0.3, z * 0.5 + seed) - 0.5;
    p.setXYZ(
      i,
      x + jx * radius * 0.35,
      Math.max(0, y + jy * height * 0.08),
      z + jz * radius * 0.35
    );
  }
  geo.deleteAttribute("uv");
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let v = 0; v < pos.count; v += 3) {
    const f =
      clamp((pos.getY(v) + pos.getY(v + 1) + pos.getY(v + 2)) / 3 / height, 0, 1);
    let i = 0;
    while (i < PEAK_STOPS.length - 2 && f > PEAK_STOPS[i + 1][0]) i++;
    const [h0, c0] = PEAK_STOPS[i];
    const [h1, c1] = PEAK_STOPS[i + 1];
    c.copy(c0).lerp(c1, clamp((f - h0) / (h1 - h0), 0, 1));
    c.multiplyScalar(0.94 + ((v * 0.6180339) % 1) * 0.12);
    for (let k = 0; k < 3; k++) {
      const o = (v + k) * 3;
      colors[o] = c.r;
      colors[o + 1] = c.g;
      colors[o + 2] = c.b;
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

// Utility: paint a whole geometry one colour (adds a `color` attribute).
export function colorize(geo, hex) {
  const n = geo.attributes.position.count;
  const col = new THREE.Color(hex);
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = col.r;
    arr[i * 3 + 1] = col.g;
    arr[i * 3 + 2] = col.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geo;
}
