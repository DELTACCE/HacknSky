import * as THREE from "three";
import { smoothstep } from "./noise";
import { FALL_CENTER, heightAt, riverX } from "./world";

// 1 on the cliff face (waterfall), fading to 0 either side.
export function fallFactor(z) {
  return 1 - smoothstep(2.0, 3.5, Math.abs(z - FALL_CENTER));
}

function waterSample(z) {
  const x = riverX(z);
  let top = -Infinity;
  for (const k of [-0.8, 0, 0.8]) top = Math.max(top, heightAt(x, z + k));
  const f = fallFactor(z);
  return {
    x,
    y: top + 0.95,
    z: z + f * 1.1, // hang the sheet slightly in front of the cliff
    w: 4.8 + 2.6 * f,
    f,
  };
}

// A ribbon of water that follows the river centre line and the terrain.
// Rows run from back (zBack) to front (zFront) so uv.y grows downstream.
export function buildRibbon({ zBack, zFront, rows }) {
  const pos = new Float32Array((rows + 1) * 2 * 3);
  const uv = new Float32Array((rows + 1) * 2 * 2);
  const fall = new Float32Array((rows + 1) * 2);
  let dist = 0;
  let prev = null;
  for (let i = 0; i <= rows; i++) {
    const z = zBack + ((zFront - zBack) * i) / rows;
    const s = waterSample(z);
    if (prev) {
      dist += Math.hypot(s.x - prev.x, s.y - prev.y, s.z - prev.z);
    }
    prev = s;
    for (let side = 0; side < 2; side++) {
      const n = i * 2 + side;
      const dx = side === 0 ? -s.w / 2 : s.w / 2;
      pos[n * 3] = s.x + dx;
      pos[n * 3 + 1] = s.y;
      pos[n * 3 + 2] = s.z;
      uv[n * 2] = side;
      uv[n * 2 + 1] = dist;
      fall[n] = s.f;
    }
  }
  const idx = [];
  for (let i = 0; i < rows; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setAttribute("aFall", new THREE.BufferAttribute(fall, 1));
  geo.setIndex(idx);
  return geo;
}

export { waterSample };
