import * as T from 'three';
import { C, V, bx, cyl } from './utils.js';
/**
 * Conceptual Sky Storm–style cableway: route, towers, stations, rope and animated gondolas.
 */

export function createCableRoute(ctx) {
  const { ter } = ctx;
  // ---- cableway route (needed before trees) ----
  const yL = ter(-100, 0) + 65,
    yR = ter(100, 0) + 65,
    cy = (x) => yL + ((yR - yL) * (x + 100)) / 200,
    TX = [-50, 0, 50],
    sl = Math.atan2(yR - yL, 200),
    pts = [];
  for (let x = -100; x <= 100; x += 4) {
    const s = ((x + 100) % 50) / 50;
    pts.push(V(x, cy(x) - 3 * 4 * s * (1 - s), 0));
  }
  const curve = new T.CatmullRomCurve3(pts);

  return { cy, TX, sl, curve };
}

export async function createCableCar(ctx) {
  const { TX, curve, cy, reduce, scene, sl, step, ter } = ctx;
  await step('Hanging the cable…', 62);
  // ---- cableway ----
  const steel = new T.MeshStandardMaterial({
      color: C(0x8e9696),
      metalness: 0.85,
      roughness: 0.42,
      envMapIntensity: 1.2,
    }),
    dsteel = new T.MeshStandardMaterial({
      color: C(0x2c3335),
      metalness: 0.8,
      roughness: 0.5,
    });
  scene.add(new T.Mesh(new T.TubeGeometry(curve, 260, 0.16, 6), dsteel));
  // Tower: mast set 8 m to the -z side of the rope; a cantilever head carries a roller battery under the rope from the -z side only.
  // The gondola hangs on an arm offset to +z, so cabin, arm and grip never share space with beam, rollers or legs.
  TX.forEach((x) => {
    const g = new T.Group(),
      y0 = Math.min(ter(x - 3.6, -9), ter(x + 3.6, -9)) - 2,
      top = cy(x) - 1.4;
    scene.add(g);
    [-1, 1].forEach((s) =>
      cyl(V(x + s * 3.6, y0, -9), V(x + s * 0.7, top, -8.2), 0.55, 0.3, steel, g),
    );
    for (let k = 1; k <= 5; k++) {
      const t = k / 6,
        y = y0 + (top - y0) * t,
        w = 3.6 - 2.9 * t,
        z = -9 + 0.8 * t,
        t2 = (k + 1) / 6;
      cyl(V(x - w, y, z), V(x + w, y, z), 0.14, 0.14, steel, g);
      if (k < 5)
        cyl(
          V(x - w, y, z),
          V(x + 3.6 - 2.9 * t2, y0 + (top - y0) * t2, -9 + 0.8 * t2),
          0.1,
          0.1,
          steel,
          g,
        );
    }
    const h = new T.Group();
    h.position.set(x, cy(x), 0);
    h.rotation.z = sl;
    scene.add(h);
    const pl = new T.Mesh(new T.BoxGeometry(2.4, 0.8, 1.2), steel);
    pl.position.set(0, -1.1, -8.2);
    h.add(pl);
    const bm = new T.Mesh(new T.BoxGeometry(0.7, 0.6, 8.15), steel);
    bm.position.set(0, -0.8, -4.42);
    h.add(bm);
    const fp = new T.Mesh(new T.BoxGeometry(3.6, 0.9, 0.12), steel);
    fp.position.set(0, -0.9, -0.38);
    h.add(fp);
    [-1.3, 0, 1.3].forEach((rx) => {
      const r = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.5, 20), dsteel);
      r.rotation.x = Math.PI / 2;
      r.position.set(rx, -0.71, 0);
      h.add(r);
    });
    g.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    h.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
  });
  const conc = new T.MeshStandardMaterial({
    color: C(0x8c8a80),
    roughness: 0.9,
  });
  [-1, 1].forEach((s) => {
    const b = new T.Mesh(new T.BoxGeometry(14, 13, 20), conc);
    b.position.set(s * 105, cy(s * 100) - 9, 0);
    scene.add(b);
    const r = new T.Mesh(new T.BoxGeometry(16, 1.2, 22), dsteel);
    r.position.set(s * 105, cy(s * 100) - 2, 0);
    scene.add(r);
    const w = new T.Mesh(new T.CylinderGeometry(3, 3, 1, 24), steel);
    w.rotation.x = Math.PI / 2;
    w.position.set(s * 99, cy(s * 100) - 1.2, 0);
    scene.add(w);
  });
  // ---- gondola: Sky Storm–style monocab (stylised illustration, not an exact replica) ----
  const carrier = new T.Group(),
    grip = new T.Group(),
    hang = new T.Group();
  hang.position.z = 0.62;
  carrier.add(grip, hang);
  // rounded box via extruded profile — soft corners read as injection-moulded cabin parts
  const rboxGeo = (w, h, d, r) => {
    r = Math.min(r, w / 2.05, h / 2.05, d / 2.05);
    const hw = w / 2 - r,
      hh = h / 2 - r,
      s = new T.Shape();
    s.moveTo(-hw, -h / 2);
    s.lineTo(hw, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -hh);
    s.lineTo(w / 2, hh);
    s.quadraticCurveTo(w / 2, h / 2, hw, h / 2);
    s.lineTo(-hw, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, hh);
    s.lineTo(-w / 2, -hh);
    s.quadraticCurveTo(-w / 2, -h / 2, -hw, -h / 2);
    const g = new T.ExtrudeGeometry(s, {
      depth: d - 2 * r,
      bevelEnabled: true,
      bevelSize: r,
      bevelThickness: r,
      bevelSegments: 2,
      curveSegments: 4,
      steps: 1,
    });
    g.translate(0, 0, r - d / 2);
    g.computeVertexNormals();
    return g;
  };
  const rx = (w, h, d, r, m, x, y, z, p) => {
    const o = new T.Mesh(rboxGeo(w, h, d, r), m);
    o.position.set(x, y, z);
    p.add(o);
    return o;
  };
  const skyOrange = new T.MeshPhysicalMaterial({
      color: C(0xe2611c),
      roughness: 0.34,
      metalness: 0.05,
      clearcoat: 0.75,
      clearcoatRoughness: 0.3,
      envMapIntensity: 1.1,
    }),
    skyCream = new T.MeshPhysicalMaterial({
      color: C(0xf2e7d1),
      roughness: 0.42,
      metalness: 0.02,
      clearcoat: 0.5,
      envMapIntensity: 0.9,
    }),
    skyGlass = new T.MeshPhysicalMaterial({
      color: C(0x14212b),
      roughness: 0.08,
      metalness: 0.3,
      transparent: true,
      opacity: 0.78,
      envMapIntensity: 2.8,
      clearcoat: 0.9,
      side: T.DoubleSide,
      depthWrite: false,
    }),
    skyDark = new T.MeshStandardMaterial({
      color: C(0x23272b),
      roughness: 0.55,
      metalness: 0.5,
      envMapIntensity: 0.7,
    }),
    skyWarm = new T.MeshBasicMaterial({ color: C(0xffd9a0) });
  // grip: detachable carriage riding the rope
  bx(1.5, 0.34, 0.42, skyDark, 0, 0.32, 0, grip);
  bx(0.62, 0.5, 0.5, skyDark, 0, -0.02, 0, grip);
  [-0.52, 0.52].forEach((s) => {
    const w = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.16, 16), skyDark);
    w.rotation.x = Math.PI / 2;
    w.position.set(s, 0.5, 0);
    grip.add(w);
    bx(0.14, 0.5, 0.14, skyDark, s, 0.2, 0, grip);
  });
  bx(0.3, 0.34, 0.34, skyDark, 0, -0.4, 0, grip);
  // hanger arm: mast + knee braces down to the cabin roof
  cyl(V(0, -0.3, 0), V(0, -3.55, 0), 0.13, 0.11, skyDark, hang);
  [-1, 1].forEach((s) => {
    cyl(V(0, -2.5, 0), V(s * 0.9, -3.5, 0), 0.07, 0.06, skyDark, hang);
    cyl(V(s * 0.9, -3.5, 0), V(s * 1.35, -3.95, 0), 0.06, 0.06, skyDark, hang);
  });
  const body = new T.Group();
  body.position.y = -5.05;
  hang.add(body);
  // cabin: rounded monocab — cream skirt, wrap-around glazing, orange brow
  rx(3.44, 1.2, 2.5, 0.16, skyCream, 0, -0.66, 0, body);
  rx(3.5, 0.22, 2.56, 0.1, skyDark, 0, -1.26, 0, body);
  rx(3.28, 1.2, 2.34, 0.13, skyGlass, 0, 0.58, 0, body);
  [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ].forEach(([sx, sz]) => rx(0.34, 1.26, 0.34, 0.1, skyOrange, sx * 1.5, 0.58, sz * 1.02, body));
  [-1, 1].forEach((sz) => {
    rx(3.32, 0.12, 0.1, 0.04, skyOrange, 0, 1.16, sz * 1.18, body);
    rx(3.32, 0.12, 0.1, 0.04, skyOrange, 0, 0, sz * 1.18, body);
  });
  [-1, 1].forEach((sx) => {
    rx(0.1, 0.12, 2.26, 0.04, skyOrange, sx * 1.64, 1.16, 0, body);
    rx(0.1, 0.12, 2.26, 0.04, skyOrange, sx * 1.64, 0, 0, body);
  });
  rx(3.46, 0.34, 2.52, 0.13, skyOrange, 0, 1.3, 0, body);
  rx(3.1, 0.14, 2.16, 0.07, skyDark, 0, 1.5, 0, body);
  [-1, 1].forEach((sz) => rx(0.05, 1.02, 0.08, 0.02, skyDark, 0, 0.58, sz * 1.17, body));
  [-1, 1].forEach((sx) => rx(0.08, 1.02, 0.05, 0.02, skyDark, sx * 1.63, 0.58, 0, body));
  [
    [-1.66, -1.24],
    [1.66, -1.24],
    [-1.66, 1.24],
    [1.66, 1.24],
  ].forEach(([x, z]) => rx(0.32, 0.28, 0.32, 0.08, skyDark, x, -1.12, z, body));
  rx(0.26, 0.07, 0.05, 0.02, skyDark, 0, 0.35, 1.18, body);
  const bench = new T.MeshStandardMaterial({
    color: C(0x2a2320),
    roughness: 0.8,
  });
  [-0.86, 0.86].forEach((z) => {
    bx(2.7, 0.16, 0.5, bench, 0, -0.62, z, body);
    bx(2.7, 0.5, 0.12, bench, 0, -0.34, z + (z > 0 ? 0.22 : -0.22), body);
  });
  bx(1.5, 0.06, 0.6, skyWarm, 0, 1.12, 0, body);
  bx(1.1, 0.16, 0.06, skyOrange, 0, -0.62, 1.17, body);
  carrier.scale.setScalar(1.75);
  scene.add(carrier);
  const amb = [
    { o: 0.1, v: 1 },
    { o: 0.55, v: 0.8 },
  ].map((a) => {
    const c = carrier.clone();
    scene.add(c);
    return Object.assign(a, { c, g: c.children[0], h: c.children[1] });
  });
  const U = [
    [0, 0.3],
    [0.2, 0.4],
    [0.28, 0.5],
    [0.35, 0.58],
    [0.5, 0.7],
    [0.65, 0.78],
    [0.88, 0.86],
    [1, 0.92],
  ];
  function uAt(p) {
    let i = 0;
    while (i < U.length - 2 && p > U[i + 1][0]) i++;
    const a = U[i],
      b = U[i + 1];
    return a[1] + (b[1] - a[1]) * Math.min(1, Math.max(0, (p - a[0]) / (b[0] - a[0])));
  }
  const bo = V(0, -8.8, 1.12),
    bodyAt = (p) => curve.getPointAt(uAt(p)).add(bo);
  function place(c, gp, hg, u, t, ph) {
    const a = curve.getPointAt(u),
      d = curve.getTangentAt(u);
    c.position.copy(a);
    gp.rotation.z = Math.atan2(d.y, d.x);
    if (!reduce) {
      hg.rotation.z = Math.sin(t * 0.9 + ph) * 0.025;
      hg.rotation.x = Math.sin(t * 0.6 + ph) * 0.02;
    }
  }
  const update = (t, p) => {
    place(carrier, grip, hang, uAt(p), t, 0);
    amb.forEach((a, i) =>
      place(a.c, a.g, a.h, 0.05 + ((t * 0.012 * a.v + a.o) % 1) * 0.9, t, i + 1),
    );
  };

  return { carrier, amb, update, bodyAt, uAt };
}
