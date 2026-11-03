import * as T from 'three';
import { ss } from '../utils/math.js';

export const V = (x, y, z) => new T.Vector3(x, y, z);
export const UP = V(0, 1, 0);
export const rnd = (a, b) => a + Math.random() * (b - a);
export { ss };
/** sRGB hex -> linear colour */
export const C = (h) => new T.Color(h).convertSRGBToLinear();

// value noise + fbm
export const hs = (i, j) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const vn = (x, y) => {
  const i = Math.floor(x),
    j = Math.floor(y),
    f = x - i,
    g = y - j,
    u = f * f * (3 - 2 * f),
    v = g * g * (3 - 2 * g),
    a = hs(i, j),
    b = hs(i + 1, j),
    c = hs(i, j + 1),
    d = hs(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
export const fbm = (x, y) => {
  let s = 0,
    a = 0.5;
  for (let k = 0; k < 4; k++) {
    s += a * vn(x, y);
    x = x * 2.03 + 7;
    y = y * 2.03 + 3;
    a *= 0.5;
  }
  return s / 0.9375;
};

// geometry helpers
export function cyl(a, b, r0, r1, mat, g) {
  const d = b.clone().sub(a),
    m = new T.Mesh(new T.CylinderGeometry(r1, r0, d.length(), 10), mat);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  g.add(m);
  return m;
}

export const bx = (w, h, d, m, x, y, z, p) => {
  const o = new T.Mesh(new T.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  p.add(o);
  return o;
};
