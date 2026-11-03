import { V, ss } from './utils.js';
import { JOURNEY_RANGES } from '../data/journey.js';
/**
 * Camera choreography: keyframed path through the journey (Hermite spline) and terrain clearance.
 */

export function createCameraController(ctx) {
  const { VH, VX, VZ, bodyAt, ter } = ctx;
  const MF = innerWidth < 760 ? 1.35 : 1;
  const SPEC = (p, s, f = 1) =>
    s[0] === 'w'
      ? V(s[1], s[2], s[3])
      : s[0] === 't'
        ? V(s[1], ter(s[1], s[2]) + s[3], s[2])
        : bodyAt(p).add(V(s[1] * f, s[2] * f, s[3] * f));
  const KEYS = [
    [0, ['g', 14, 4, 38], ['g', -9, 2, 0]],
    [0.1, ['g', -10, 18, 45], ['g', 4, -5, 0]],
    [0.15, ['w', -105, 118, 105], ['w', -15, 52, -25]],
    [0.2, ['g', -20, 8, 27], ['g', 10, -1, 0]],
    [0.255, ['g', 13, 5, 22], ['g', 9, -1, 1]],
    [0.29, ['g', 2, 4, 26], ['g', 9, -1, 0]],
    [0.35, ['g', -12, 11, 30], ['g', 9, -4, 0]],
    [0.42, ['g', -26, 38, 46], ['g', 10, -14, -6]],
    [0.5, ['w', 95, 125, 95], ['w', 20, 15, -30]],
    [0.58, ['w', 92, VH + 70, 45], ['w', VX, VH, VZ]],
    [0.65, ['w', 36, VH + 22, -6], ['w', VX, VH + 3, VZ]],
    [0.78, ['w', 5, VH + 35, 35], ['w', VX, VH + 3, VZ]],
    [0.84, ['w', -25, VH + 50, 70], ['w', VX, VH + 4, VZ]],
    [0.92, ['w', -45, VH + 60, 95], ['w', 50, VH + 5, -30]],
    [1, ['w', -70, 145, 140], ['w', 20, 45, -30]],
  ].map((k) => ({
    p: k[0],
    pos: SPEC(k[0], k[1], MF),
    look: SPEC(k[0], k[2]),
  }));
  KEYS.forEach((k, i) => {
    const a = KEYS[Math.max(0, i - 1)],
      b = KEYS[Math.min(KEYS.length - 1, i + 1)],
      d = b.p - a.p;
    k.mp = b.pos.clone().sub(a.pos).divideScalar(d);
    k.ml = b.look.clone().sub(a.look).divideScalar(d);
  });
  function camAt(p) {
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[i],
      b = KEYS[i + 1],
      h = b.p - a.p,
      t = Math.min(1, Math.max(0, (p - a.p) / h)),
      t2 = t * t,
      t3 = t2 * t,
      A = 2 * t3 - 3 * t2 + 1,
      B = (t3 - 2 * t2 + t) * h,
      Cc = -2 * t3 + 3 * t2,
      D = (t3 - t2) * h;
    const f = (k, m) =>
      V(0, 0, 0)
        .addScaledVector(a[k], A)
        .addScaledVector(a[m], B)
        .addScaledVector(b[k], Cc)
        .addScaledVector(b[m], D);
    return [f('pos', 'mp'), f('look', 'ml')];
  }
  const camMin = (x, z) => ter(x, z) + 6 + 24 * ss(26, 40, Math.hypot(x - VX, z - VZ));
  /** -1 = chapter text on the left (scene slides right), +1 = text on the right, 0 = centred. */
  const SIDE = JOURNEY_RANGES.map((_, i) =>
    i === 0 ? -1 : i === JOURNEY_RANGES.length - 1 ? 0 : i % 2 ? -1 : 1,
  );

  /** Positions `camera` for scroll progress `p`. mx/my are pointer parallax in [-.5, .5]. */
  function apply(camera, p, { mx = 0, my = 0, linear = false } = {}) {
    const [cp, lk] = camAt(p);
    cp.x += mx * 1.4;
    cp.y -= my * 0.8;
    const floor = camMin(cp.x, cp.z);
    if (cp.y < floor) cp.y = floor;
    camera.position.copy(cp);
    camera.lookAt(lk);

    // On wide screens slide the scene away from the chapter text so the set stays visible.
    const W = innerWidth;
    const H = innerHeight;
    if (W > 820 && !linear) {
      let shift = 0;
      JOURNEY_RANGES.forEach(([a, b], i) => {
        const w = 0.03;
        const weight = i === 0 ? 1 - ss(0.07, 0.1, p) : ss(a, a + w, p) * (1 - ss(b - w, b, p));
        shift += SIDE[i] * weight;
      });
      camera.setViewOffset(W, H, shift * 0.25 * W, 0, W, H);
    } else camera.clearViewOffset();
  }

  return { camAt, camMin, apply };
}
