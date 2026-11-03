import * as T from 'three';
import { C, UP, V, rnd, vn } from './utils.js';
/**
 * Procedural rainforest (giants, coconut palms, understory) and faceted boulders, all instanced.
 */

export async function createForest(ctx) {
  const { TX, VX, VZ, cy, lo, rdist, scene, step, ter } = ctx;
  const tc = new T.Color();
  {
    await step('Planting the rainforest…', 42);
    const R = rnd,
      m4 = new T.Matrix4(),
      qq = new T.Quaternion(),
      eu = new T.Euler(),
      sc = new T.Vector3(),
      ps = new T.Vector3(),
      NC = lo ? 12 : 20;
    const mk = () => ({ p: [], n: [], u: [], c: [], i: [] });
    const fin = (b) => {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(b.p, 3));
      g.setAttribute('normal', new T.Float32BufferAttribute(b.n, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(b.u, 2));
      g.setAttribute('color', new T.Float32BufferAttribute(b.c, 3));
      g.setIndex(b.i);
      g.computeBoundingSphere();
      return g;
    };
    const tube = (b, pts, r0, r1, cl, fl) => {
      const sd = 7,
        o = b.p.length / 3;
      pts.forEach((q, i) => {
        const t = i / (pts.length - 1),
          r = (r0 + (r1 - r0) * t) * (1 + (fl || 0) * Math.exp(-t * 12)),
          a = pts[Math.max(0, i - 1)],
          z = pts[Math.min(pts.length - 1, i + 1)],
          tg = z.clone().sub(a).normalize(),
          n1 = tg
            .clone()
            .cross(Math.abs(tg.y) > 0.95 ? V(1, 0, 0) : UP)
            .normalize(),
          n2 = tg.clone().cross(n1);
        for (let j = 0; j <= sd; j++) {
          const an = (j / sd) * 6.2832,
            d = n1.clone().multiplyScalar(Math.cos(an)).addScaledVector(n2, Math.sin(an)),
            v = 0.78 + 0.22 * Math.sin(j * 2.1 + i);
          b.p.push(q.x + d.x * r, q.y + d.y * r, q.z + d.z * r);
          b.n.push(d.x, d.y, d.z);
          b.u.push(j / sd, t * 4);
          b.c.push(cl[0] * v, cl[1] * v, cl[2] * v);
          if (i && j < sd) {
            const k = o + (i - 1) * (sd + 1) + j;
            b.i.push(k, k + 1, k + sd + 1, k + 1, k + sd + 2, k + sd + 1);
          }
        }
      });
    };
    const G0 = C(0x1b4222),
      G1 = C(0x8cc040),
      BR = [0.3, 0.22, 0.16];
    // leaf cards: crossed, outward-facing normals give soft, ball-lit crowns
    const card = (b, c, p, s, k) => {
      const u = V(R(-1, 1), R(-0.3, 0.5), R(-1, 1)).normalize(),
        w = V(R(-1, 1), R(-1, 1), R(-1, 1)).cross(u).normalize(),
        nn = p.clone().sub(c).normalize();
      nn.y += 0.35;
      nn.normalize();
      const h = s / 2,
        cl = G0.clone().lerp(G1, Math.min(1, Math.max(0, k + R(-0.2, 0.2))));
      [0, 1].forEach((f) => {
        const o = b.p.length / 3;
        [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ].forEach(([x, y]) => {
          b.p.push(
            p.x + (u.x * x + w.x * y) * h,
            p.y + (u.y * x + w.y * y) * h,
            p.z + (u.z * x + w.z * y) * h,
          );
          b.n.push(nn.x, nn.y, nn.z);
          b.u.push((x + 1) / 2, (y + 1) / 2);
          b.c.push(cl.r, cl.g, cl.b);
        });
        b.i.push(...(f ? [o, o + 2, o + 1, o, o + 3, o + 2] : [o, o + 1, o + 2, o, o + 2, o + 3]));
      });
    };
    const crown = (b, c, rx, ry, n, s) => {
      for (let i = 0; i < n; i++) {
        let x, y, z;
        do {
          x = R(-1, 1);
          y = R(-1, 1);
          z = R(-1, 1);
        } while (x * x + y * y + z * z > 1);
        card(
          b,
          c,
          V(c.x + x * rx, c.y + y * ry, c.z + z * rx),
          s * R(0.8, 1.25),
          0.5 + y * 0.45 + x * 0.1,
        );
      }
    };
    const giant = () => {
      const T1 = mk(),
        L1 = mk(),
        H = 22,
        pts = [];
      for (let i = 0; i <= 8; i++)
        pts.push(V(Math.sin(i * 0.7) * 0.4, (H * 0.66 * i) / 8, Math.cos(i * 0.5) * 0.3));
      tube(T1, pts, 0.62, 0.3, BR, 1.4);
      [
        [0, H * 0.8, 0, 6.6, 5],
        [4.4, H * 0.62, 1.6, 4.6, 3.5],
        [-4, H * 0.58, -2, 4.4, 3.3],
        [0.8, H * 0.5, -4.2, 3.7, 2.9],
      ].forEach(([x, y, z, rx, ry]) => {
        tube(
          T1,
          [V(0, H * 0.5, 0), V(x * 0.5, (H * 0.5 + y) / 2, z * 0.5), V(x, y - ry * 0.4, z)],
          0.2,
          0.1,
          BR,
        );
        crown(L1, V(x, y, z), rx, ry, NC, 5.8);
      });
      return [fin(T1), fin(L1)];
    };
    const palm = () => {
      const T1 = mk(),
        L1 = mk(),
        H = R(10, 13),
        ln = V(R(-2.5, 2.5), 0, R(-2.5, 2.5)),
        pts = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push(V(ln.x * t * t, H * t, ln.z * t * t));
      }
      tube(T1, pts, 0.3, 0.18, [0.52, 0.45, 0.36], 0.45);
      const top = pts[8];
      for (let f = 0; f < 13; f++) {
        const an = f * 2.4 + R(-0.2, 0.2),
          dx = Math.cos(an),
          dz = Math.sin(an),
          len = R(4.4, 5.6),
          up = R(0.8, 1.8),
          cl = G0.clone().lerp(G1, R(0.45, 0.85));
        [0, 1].forEach((side) => {
          const o = L1.p.length / 3;
          for (let s = 0; s <= 6; s++) {
            const t = s / 6,
              w = 1.15 * (1 - t * 0.5),
              y = top.y + up * Math.sin(t * 2.3) - 2.6 * t * t,
              r = len * t;
            [-1, 1].forEach((q) => {
              L1.p.push(top.x + dx * r - dz * w * q, y, top.z + dz * r + dx * w * q);
              L1.n.push(dx * 0.35, 0.9, dz * 0.35);
              L1.u.push(t, q < 0 ? 0 : 1);
              L1.c.push(cl.r, cl.g, cl.b);
            });
            if (s < 6) {
              const k = o + s * 2;
              L1.i.push(
                ...(side
                  ? [k, k + 1, k + 2, k + 1, k + 3, k + 2]
                  : [k, k + 2, k + 1, k + 1, k + 2, k + 3]),
              );
            }
          }
        });
      }
      return [fin(T1), fin(L1)];
    };
    const bush = () => {
      const L1 = mk();
      crown(L1, V(0, 1.1, 0), 1.7, 1.1, lo ? 8 : 12, 2.3);
      return [null, fin(L1)];
    };
    // textures: leafy branchlet + feathered palm frond
    const cvs = (w, h) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    };
    const tx = (c) => {
      const t = new T.CanvasTexture(c);
      t.encoding = T.sRGBEncoding;
      t.anisotropy = 4;
      return t;
    };
    const lc = cvs(256, 256),
      l2 = lc.getContext('2d');
    for (let i = 0; i < 46; i++) {
      const v = R(205, 255) | 0;
      l2.fillStyle = 'rgb(' + v + ',' + v + ',' + (v - 20) + ')';
      l2.beginPath();
      l2.ellipse(R(30, 226), R(30, 226), R(26, 40), R(9, 14), R(0, 6.28), 0, 6.2832);
      l2.fill();
    }
    const fc = cvs(512, 128),
      f2 = fc.getContext('2d');
    f2.strokeStyle = '#fff';
    f2.lineCap = 'round';
    f2.lineWidth = 8;
    f2.beginPath();
    f2.moveTo(0, 64);
    f2.lineTo(512, 64);
    f2.stroke();
    f2.lineWidth = 9;
    for (let x = 14; x < 500; x += 9) {
      const L = 60 * (1 - Math.pow(x / 512, 2) * 0.75);
      [-1, 1].forEach((s) => {
        f2.beginPath();
        f2.moveTo(x, 64);
        f2.lineTo(x + L * 0.55, 64 + s * L);
        f2.stroke();
      });
    }
    const leafT = tx(lc),
      frondT = tx(fc),
      mat = (m) =>
        new T.MeshStandardMaterial({
          map: m,
          vertexColors: true,
          alphaTest: 0.5,
          roughness: 0.85,
          envMapIntensity: 0.6,
        }),
      leafM = mat(leafT),
      frondM = mat(frondT),
      trunkM = new T.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
    const types = {
      giant: {
        v: [giant(), giant()],
        h: 22,
        m: leafM,
        map: leafT,
        L: [[], []],
      },
      palm: { v: [palm(), palm()], h: 12, m: frondM, map: frondT, L: [[], []] },
      bush: { v: [bush(), bush()], h: 3, m: leafM, map: leafT, L: [[], []] },
    };
    const NT = lo ? 420 : 1250,
      cableAt = (x) => cy(x) - 3;
    let cnt = 0;
    for (let k = 0; k < NT * 9 && cnt < NT; k++) {
      const x = (Math.random() - 0.5) * 330,
        z = (Math.random() - 0.5) * 255,
        y = ter(x, z);
      if (
        Math.abs(ter(x + 2.5, z) - y) + Math.abs(ter(x, z + 2.5) - y) > 4.5 ||
        Math.hypot(x - VX, z - VZ) < 27 ||
        (Math.abs(x) > 94 && Math.abs(z) < 16) ||
        (Math.abs(z) < 14 && TX.some((t) => Math.abs(x - t) < 11)) ||
        rdist(x, z) < 6
      )
        continue;
      const r = Math.random(),
        id =
          r < 0.3 ? 'bush' : (y < 28 || rdist(x, z) < 24) && r < 0.65 && y < 42 ? 'palm' : 'giant',
        ty = types[id];
      if (id === 'giant' && Math.hypot(x - VX, z - VZ) < 44) continue;
      let s = R(0.8, 1.3);
      if (Math.abs(z) < 11 && Math.abs(x) < 100) {
        const lim = cableAt(x) - 14 - y;
        if (ty.h * s > lim) {
          s = lim / ty.h;
          if (s < 0.4) continue;
        }
      }
      ty.L[(Math.random() * 2) | 0].push([x, y - 0.3, z, s, R(0, 6.28)]);
      cnt++;
    }
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * 6.2832,
        x = VX + Math.cos(a) * 25.5,
        z = VZ + Math.sin(a) * 25.5;
      types.palm.L[i & 1].push([x, ter(x, z) - 0.3, z, R(0.9, 1.15), R(0, 6.28)]);
    }
    const inst = (geo, m, L, map) => {
      const im = new T.InstancedMesh(geo, m, L.length);
      im.frustumCulled = false;
      L.forEach((l, j) => {
        qq.setFromEuler(eu.set(R(-0.05, 0.05), l[4], R(-0.05, 0.05)));
        sc.setScalar(l[3]);
        m4.compose(ps.set(l[0], l[1], l[2]), qq, sc);
        im.setMatrixAt(j, m4);
        if (map) {
          const v = R(0.8, 1.15);
          im.setColorAt(j, tc.setRGB(v * R(0.9, 1.05), v, v * R(0.85, 1)));
        }
      });
      im.castShadow = !lo;
      if (map)
        im.customDepthMaterial = new T.MeshDepthMaterial({
          depthPacking: T.RGBADepthPacking,
          map,
          alphaTest: 0.5,
        });
      scene.add(im);
    };
    Object.values(types).forEach((ty) =>
      ty.v.forEach(([tk, fo], vi) => {
        const L = ty.L[vi];
        if (!L.length) return;
        if (tk) inst(tk, trunkM, L);
        inst(fo, ty.m, L, ty.map);
      }),
    );
    // boulders: faceted, displaced icospheres
    await step('Scattering the boulders…', 54);
    const rg = [0, 1, 2].map((i) => {
        const g = new T.IcosahedronGeometry(1, 2),
          p = g.attributes.position;
        for (let j = 0; j < p.count; j++) {
          const x = p.getX(j),
            y = p.getY(j),
            z = p.getZ(j),
            n = 1 + 0.5 * (vn(x * 2 + i * 5, z * 2 + y * 2) - 0.5) + 0.08 * Math.sin(x * 5 + y * 3);
          p.setXYZ(j, x * n, y * n * 0.72, z * n);
        }
        g.computeVertexNormals();
        return g;
      }),
      rmat = new T.MeshStandardMaterial({
        color: C(0x8a867a),
        roughness: 0.95,
      }),
      RL = [[], [], []],
      NR = lo ? 70 : 200;
    let rc = 0;
    for (let k = 0; k < NR * 10 && rc < NR; k++) {
      const x = (Math.random() - 0.5) * 340,
        z = (Math.random() - 0.5) * 265,
        y = ter(x, z),
        slope = Math.abs(ter(x + 2.5, z) - y) + Math.abs(ter(x, z + 2.5) - y),
        rd = rdist(x, z),
        r = Math.random();
      if (!((rd < 14 && r < 0.85) || (slope > 2.4 && r < 0.6) || (y > 52 && r < 0.35) || r < 0.22))
        continue;
      if (
        Math.hypot(x - VX, z - VZ) < 25 ||
        (Math.abs(x) > 93 && Math.abs(z) < 15) ||
        (Math.abs(z) < 12 && TX.some((t) => Math.abs(x - t) < 9)) ||
        y > 108
      )
        continue;
      RL[(Math.random() * 3) | 0].push([x, y, z, R(0.8, 2.8), R(0, 6.28)]);
      rc++;
    }
    RL.forEach((L, i) => {
      if (!L.length) return;
      const im = new T.InstancedMesh(rg[i], rmat, L.length);
      im.frustumCulled = false;
      L.forEach((l, j) => {
        qq.setFromEuler(eu.set(R(-0.3, 0.3), l[4], R(-0.3, 0.3)));
        sc.set(l[3], l[3] * R(0.7, 1.2), l[3]);
        m4.compose(ps.set(l[0], l[1] + 0.1 * l[3], l[2]), qq, sc);
        im.setMatrixAt(j, m4);
        const v = R(0.7, 1.1);
        im.setColorAt(j, tc.setRGB(v, v * 0.97, v * 0.9));
      });
      im.castShadow = !lo;
      scene.add(im);
    });
  }

  return {};
}
