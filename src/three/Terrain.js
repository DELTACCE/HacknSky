import * as T from 'three';
import { C, V, fbm, ss, vn } from './utils.js';
/**
 * Procedural Athirappilly terrain: height field, vertex-coloured mesh and the river ribbon.
 */

export async function createTerrain(ctx) {
  const { fogC, lo, scene, step } = ctx;
  const ter0 = (x, z) => {
    const n = fbm(x * 0.017, z * 0.017);
    return (
      6 +
      n * 24 +
      ss(0, 1, (Math.abs(z) - 8) / 70) * 36 * (0.5 + n) +
      ss(60, 110, -x) * 24 +
      ss(60, 110, x) * 40 -
      26 * Math.exp((-x * x) / 2400 - (z * z) / 1800) +
      (1 - Math.abs(vn(x * 0.07, z * 0.07) * 2 - 1)) * 5 +
      32 * (1 - ss(-92, -78, z))
    );
  };
  const VX = 60,
    VZ = -36,
    VH = ter0(VX, VZ);
  const ter = (x, z) => {
    const a = ter0(x, z);
    return a + (VH - a) * (1 - ss(22, 42, Math.hypot(x - VX, z - VZ)));
  };
  await step('Shaping the Western Ghats…', 20);
  // river spline through the valley — drives wet banks and the water ribbon
  const rivPts = [
    V(14, 0, -92),
    V(9, 0, -62),
    V(1, 0, -30),
    V(-3, 0, 8),
    V(-8, 0, 44),
    V(-14, 0, 84),
    V(-20, 0, 120),
  ];
  rivPts.forEach((q) => (q.y = ter(q.x, q.z) + 0.4));
  const rcurve = new T.CatmullRomCurve3(rivPts),
    rsamp = [];
  for (let i = 0; i <= 40; i++) rsamp.push(rcurve.getPoint(i / 40));
  const rdist = (x, z) => {
    let m = 1e9;
    for (const q of rsamp) {
      const d = (x - q.x) * (x - q.x) + (z - q.z) * (z - q.z);
      if (d < m) m = d;
    }
    return Math.sqrt(m);
  };
  const seg = lo ? [110, 90] : [170, 130],
    tg = new T.PlaneGeometry(380, 300, seg[0], seg[1]);
  tg.rotateX(-Math.PI / 2);
  const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setY(i, ter(tp.getX(i), tp.getZ(i)));
  tg.computeVertexNormals();
  // subtle surface grain so slopes are not flat colour fields
  const nc = document.createElement('canvas');
  nc.width = nc.height = 128;
  const nctx = nc.getContext('2d'),
    nid = nctx.createImageData(128, 128);
  for (let i = 0; i < nid.data.length; i += 4) {
    const v = 110 + Math.random() * 70;
    nid.data[i] = nid.data[i + 1] = nid.data[i + 2] = v;
    nid.data[i + 3] = 255;
  }
  nctx.putImageData(nid, 0, 0);
  const nmap = new T.CanvasTexture(nc);
  nmap.wrapS = nmap.wrapT = T.RepeatWrapping;
  nmap.repeat.set(52, 42);
  const col = new Float32Array(tp.count * 3),
    nm = tg.attributes.normal,
    dk = C(0x16301f),
    lg = C(0x3f7d2b),
    rk = C(0x5a5546),
    hi = C(0x5e7f66),
    wetC = C(0x1c2e22),
    sunC = C(0x6d7a46),
    tc = new T.Color();
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i),
      y = tp.getY(i),
      z = tp.getZ(i);
    tc.copy(dk)
      .lerp(lg, fbm(x * 0.05, z * 0.05) * 1.25)
      .lerp(hi, ss(46, 110, y) * 0.4);
    tc.lerp(rk, Math.min(1, Math.max(0, (0.78 - nm.getY(i)) * 3.4)));
    tc.lerp(sunC, Math.max(0, -nm.getX(i) * 0.45 - nm.getZ(i) * 0.89) * 0.28);
    tc.lerp(wetC, ss(16, 2, rdist(x, z)) * 0.6);
    tc.multiplyScalar(0.7 + 0.3 * ss(-8, 30, y));
    tc.toArray(col, i * 3);
  }
  tg.setAttribute('color', new T.BufferAttribute(col, 3));
  const terrain = new T.Mesh(
    tg,
    new T.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.96,
      envMapIntensity: 0.4,
      bumpMap: nmap,
      bumpScale: 0.55,
    }),
  );
  terrain.receiveShadow = true;
  scene.add(terrain);
  // ---- river ribbon ----
  const RN = 60,
    rPos = new Float32Array((RN + 1) * 6),
    rUv = new Float32Array((RN + 1) * 4),
    rIdx = [];
  for (let i = 0; i <= RN; i++) {
    const t = i / RN,
      q = rcurve.getPoint(t),
      d = rcurve.getTangent(t),
      sd = V(-d.z, 0, d.x).normalize(),
      w = 3.2 + 1.8 * Math.sin(t * 7) + 1.2 * vn(t * 9, 3);
    q.y = ter(q.x, q.z) + 0.45;
    [1, -1].forEach((s, k) => {
      const j = i * 2 + k;
      rPos[j * 3] = q.x + sd.x * w * s;
      rPos[j * 3 + 1] = q.y;
      rPos[j * 3 + 2] = q.z + sd.z * w * s;
      rUv[j * 2] = s < 0 ? 0 : 1;
      rUv[j * 2 + 1] = t * 14;
    });
    if (i < RN) {
      const a = i * 2,
        b = a + 2;
      rIdx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  // smooth the height profile so the water reads as a river, not terrain steps
  for (let pass = 0; pass < 3; pass++)
    for (let i = 1; i < RN; i++) {
      const a = i * 6 + 1,
        b = (i + 1) * 6 + 1,
        c = (i - 1) * 6 + 1,
        y0 = rPos[a] * 0.5 + (rPos[b] + rPos[c]) * 0.25,
        y1 = rPos[a + 3] * 0.5 + (rPos[b + 3] + rPos[c + 3]) * 0.25;
      rPos[a] = y0;
      rPos[a + 3] = y1;
    }
  const rgeo = new T.BufferGeometry();
  rgeo.setAttribute('position', new T.Float32BufferAttribute(rPos, 3));
  rgeo.setAttribute('uv', new T.Float32BufferAttribute(rUv, 2));
  rgeo.setIndex(rIdx);
  rgeo.computeVertexNormals();
  const rm = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    uniforms: { t: { value: 0 }, fc: { value: fogC } },
    vertexShader:
      'varying vec2 u;varying float dd;void main(){u=uv;vec4 m=modelViewMatrix*vec4(position,1.);dd=-m.z;gl_Position=projectionMatrix*m;}',
    fragmentShader:
      'varying vec2 u;varying float dd;uniform float t;uniform vec3 fc;void main(){float e=smoothstep(0.,.18,u.x)*smoothstep(1.,.82,u.x);float f=.5+.5*sin(u.y*9.-t*1.6+sin(u.y*3.)*1.4);float rip=smoothstep(.6,1.,f)*.4;vec3 c=mix(vec3(.09,.17,.17),vec3(.38,.52,.5),rip);c=mix(c,fc,1.-exp(-pow(dd*.0045,2.)));gl_FragColor=vec4(c,(.72+.12*rip)*e);}',
  });
  scene.add(new T.Mesh(rgeo, rm));

  return { ter, VX, VZ, VH, rdist, rm, terrain };
}
