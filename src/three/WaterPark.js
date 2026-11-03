import * as T from 'three';
import { C, V, bx, cyl } from './utils.js';
/**
 * Conceptual water-park event space: plaza, wave pool, slide tower, event pavilion, tables, loungers and entrance arch.
 */

export async function createWaterPark(ctx) {
  const { VH, VX, VZ, scene, step } = ctx;
  // ---- conceptual event space: timber base camp ----
  await step('Filling the water park…', 74);
  const ven = new T.Group();
  ven.position.set(VX, VH, VZ);
  scene.add(ven);
  const conc = new T.MeshStandardMaterial({
    color: C(0x8c8a80),
    roughness: 0.9,
  });
  const wood = new T.MeshStandardMaterial({
      color: C(0x6b4a2e),
      roughness: 0.85,
    }),
    warm = new T.MeshBasicMaterial({ color: C(0xffc873) }),
    wall = new T.MeshStandardMaterial({ color: C(0xe6dcc6), roughness: 0.8 }),
    roof = new T.MeshStandardMaterial({ color: C(0x3a2a20), roughness: 0.7 });
  // main pavilion with a lit stage screen
  const pav = new T.Group();
  pav.position.set(0, 0.6, -16);
  ven.add(pav);
  [-1, 1].forEach((s) => {
    cyl(V(s * 3.4, 0, 2.2), V(s * 3.4, 4.2, 2.2), 0.16, 0.14, wood, pav);
    cyl(V(s * 3.4, 0, -2.2), V(s * 3.4, 4.2, -2.2), 0.16, 0.14, wood, pav);
  });
  [-1, 1].forEach((s) => {
    const r = new T.Mesh(new T.BoxGeometry(7.6, 0.16, 3.4), roof);
    r.position.set(0, 3.25, s * 1.4);
    r.rotation.x = s * 0.6;
    pav.add(r);
  });
  bx(7.2, 0.14, 0.14, wood, 0, 4.2, 0, pav);
  bx(7, 3.4, 0.2, wall, 0, 2.3, -2.3, pav);
  const sc2 = document.createElement('canvas');
  sc2.width = 512;
  sc2.height = 256;
  const sctx = sc2.getContext('2d');
  const sgr = sctx.createLinearGradient(0, 0, 0, 256);
  sgr.addColorStop(0, '#101a22');
  sgr.addColorStop(1, '#1d3040');
  sctx.fillStyle = sgr;
  sctx.fillRect(0, 0, 512, 256);
  sctx.fillStyle = '#e2611c';
  sctx.font = '600 46px system-ui,sans-serif';
  sctx.textAlign = 'center';
  sctx.fillText('HACKnSKY', 256, 118);
  sctx.fillStyle = 'rgba(230,220,200,.85)';
  sctx.font = '22px system-ui,sans-serif';
  sctx.fillText("DATARA '27 · PROPOSED", 256, 162);
  const stex = new T.CanvasTexture(sc2);
  stex.encoding = T.sRGBEncoding;
  bx(6.4, 3, 0.08, new T.MeshBasicMaterial({ map: stex }), 0, 2.5, -2.14, pav);
  bx(5.2, 0.7, 1.4, wood, 0, 0.8, 0.4, pav);
  [-2.6, 2.6].forEach((x) => bx(1, 1.8, 0.8, conc, x, 1.5, -1.4, pav));
  // build tables with lit laptops
  const screenM = new T.MeshBasicMaterial({ color: C(0x9fd0e8) });
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 2; j++) {
      const tb = new T.Group();
      tb.position.set(-4.5 + i * 4.5, 0.6, -10.5 + j * 3.6);
      ven.add(tb);
      bx(3.6, 0.1, 1.4, wood, 0, 0.75, 0, tb);
      [-1.5, 1.5].forEach((px) =>
        [-0.5, 0.5].forEach((pz) => bx(0.1, 0.75, 0.1, wood, px, 0.37, pz, tb)),
      );
      for (let k = -1; k <= 1; k++) {
        bx(0.62, 0.4, 0.02, screenM, k * 1.1, 1.06, -0.1, tb);
        bx(0.62, 0.04, 0.4, wall, k * 1.1, 0.84, 0.12, tb);
      }
    }
  const poolU = { t: { value: 0 } };
  {
    const stone = new T.MeshStandardMaterial({
        color: C(0xd9cdb4),
        roughness: 0.9,
      }),
      rimM = new T.MeshStandardMaterial({ color: C(0xf1ece0), roughness: 0.6 }),
      P = [
        [-8, 6, 8],
        [8, 14, 4.3],
      ];
    // stone plaza with the pools cut out of it
    const deck = new T.Mesh(new T.CylinderGeometry(22, 22, 0.9, 64), stone);
    deck.position.y = 0.15;
    deck.receiveShadow = true;
    ven.add(deck);
    const sk = new T.Mesh(
      new T.CylinderGeometry(22.4, 26, 5, 48),
      new T.MeshStandardMaterial({ color: C(0x6f8f93), roughness: 0.9 }),
    );
    sk.position.y = -2.5;
    ven.add(sk);
    const pwm = new T.ShaderMaterial({
      transparent: true,
      uniforms: poolU,
      vertexShader:
        'varying vec2 u;void main(){u=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'varying vec2 u;uniform float t;void main(){vec2 p=u-.5;float d=length(p)*2.;float w=sin(d*22.-t*2.4)*.5+.5;float c=sin(p.x*38.+t*1.1)*sin(p.y*34.-t*.9);vec3 col=mix(vec3(.12,.8,.78),vec3(.02,.44,.56),1.-smoothstep(.3,1.,d));col+=vec3(.5,.8,.8)*pow(max(c,0.),3.)*.35;col+=vec3(.9)*smoothstep(.7,1.,w)*.12*(1.-d);col=mix(col,vec3(.95),smoothstep(.9,1.,d)*.6);gl_FragColor=vec4(col,1.);}',
    });
    P.forEach(([x, z, r]) => {
      const w = new T.Mesh(new T.CircleGeometry(r, 48), pwm);
      w.rotation.x = -Math.PI / 2;
      w.position.set(x, 0.72, z);
      ven.add(w);
      const rm2 = new T.Mesh(new T.TorusGeometry(r + 0.1, 0.3, 8, 56), rimM);
      rm2.rotation.x = Math.PI / 2;
      rm2.position.set(x, 0.7, z);
      ven.add(rm2);
    });
    // slide tower with three flumes spiralling into the splash pool
    const TW = V(12, 0, -3),
      supM = new T.MeshStandardMaterial({
        color: C(0xe8e2d0),
        metalness: 0.3,
        roughness: 0.5,
      });
    [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].forEach(([a, b]) =>
      cyl(
        V(TW.x + a * 2.4, 0.6, TW.z + b * 2.4),
        V(TW.x + a * 1.9, 17, TW.z + b * 1.9),
        0.32,
        0.26,
        supM,
        ven,
      ),
    );
    [5, 10].forEach((y) => {
      const r = new T.Mesh(new T.TorusGeometry(2.9 - y * 0.03, 0.1, 6, 20), supM);
      r.rotation.x = Math.PI / 2;
      r.position.set(TW.x, y, TW.z);
      ven.add(r);
    });
    const plat = new T.Mesh(new T.CylinderGeometry(3.6, 3.6, 0.4, 24), supM);
    plat.position.set(TW.x, 17, TW.z);
    ven.add(plat);
    const roofC = new T.Mesh(
      new T.ConeGeometry(4.4, 2.2, 16),
      new T.MeshStandardMaterial({ color: C(0xe2611c), roughness: 0.5 }),
    );
    roofC.position.set(TW.x, 20.6, TW.z);
    ven.add(roofC);
    [0xf2c230, 0xd8402e, 0x2b8bd6].forEach((hex, k) => {
      const Q = [];
      for (let i = 0; i <= 9; i++) {
        const t = i / 9,
          an = k * 2.094 + t * 8.8;
        Q.push(V(TW.x + Math.cos(an) * 3.5, 16.4 - t * 8.6 - k * 0.35, TW.z + Math.sin(an) * 3.5));
      }
      const E = Q[9],
        L = V(8 + (k - 1) * 2.4, 1.4, 10.2);
      Q.push(
        E.clone()
          .lerp(L, 0.35)
          .setY(E.y - 1.6),
        E.clone().lerp(L, 0.7).setY(3.6),
        L,
        V(L.x + (k - 1) * 0.4, 0.9, L.z + 2.6),
      );
      const cv2 = new T.CatmullRomCurve3(Q, false, 'catmullrom', 0.5),
        m = new T.Mesh(
          new T.TubeGeometry(cv2, 100, 1, 12),
          new T.MeshStandardMaterial({
            color: C(hex),
            roughness: 0.3,
            envMapIntensity: 1,
          }),
        );
      m.castShadow = true;
      ven.add(m);
      for (let u = 0.08; u < 0.86; u += 0.09) {
        const q = cv2.getPoint(u);
        if (q.y > 3) cyl(V(q.x, 0.6, q.z), V(q.x, q.y - 0.9, q.z), 0.12, 0.12, supM, ven);
      }
    });
    // umbrellas + loungers around the wave pool
    const umb = new T.InstancedMesh(
        new T.ConeGeometry(1.8, 0.7, 10),
        new T.MeshStandardMaterial({ roughness: 0.7 }),
        16,
      ),
      pol = new T.InstancedMesh(new T.CylinderGeometry(0.06, 0.06, 2.6, 6), supM, 16),
      lng = new T.InstancedMesh(
        new T.BoxGeometry(0.7, 0.18, 1.9),
        new T.MeshStandardMaterial({ color: C(0xf2e7d1), roughness: 0.7 }),
        16,
      );
    let n = 0;
    const mm = new T.Matrix4(),
      q4 = new T.Quaternion(),
      e4 = new T.Euler();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 6.2832 + 0.2,
        x = -8 + Math.cos(a) * 11.4,
        z = 6 + Math.sin(a) * 11.4;
      if (Math.hypot(x, z) > 20.2 || (z < -4 && Math.abs(x) < 8)) continue;
      umb.setMatrixAt(n, mm.setPosition(x, 3.2, z));
      umb.setColorAt(n, new T.Color(n % 2 ? C(0xe2611c) : C(0xf2e7d1)));
      pol.setMatrixAt(n, mm.setPosition(x, 1.9, z));
      lng.setMatrixAt(
        n,
        mm.compose(
          V(-8 + Math.cos(a) * 9.5, 0.8, 6 + Math.sin(a) * 9.5),
          q4.setFromEuler(e4.set(0, -a, 0)),
          V(1, 1, 1),
        ),
      );
      n++;
    }
    [umb, pol, lng].forEach((o) => {
      o.count = n;
      o.frustumCulled = false;
      o.castShadow = true;
      ven.add(o);
    });
    // entrance arch + festoon lights
    const ac = document.createElement('canvas');
    ac.width = 512;
    ac.height = 96;
    const a2 = ac.getContext('2d');
    a2.fillStyle = '#0f2f38';
    a2.fillRect(0, 0, 512, 96);
    a2.fillStyle = '#e2611c';
    a2.fillRect(0, 0, 512, 8);
    a2.fillStyle = '#f2e7d1';
    a2.font = '700 54px system-ui,sans-serif';
    a2.textAlign = 'center';
    a2.fillText('HACKnSKY', 256, 68);
    const at = new T.CanvasTexture(ac);
    at.encoding = T.sRGBEncoding;
    [-1, 1].forEach((s) => cyl(V(s * 6.5, 0.6, 19.5), V(s * 6.5, 7, 19.5), 0.3, 0.3, wood, ven));
    const sg = new T.Mesh(
      new T.PlaneGeometry(13.6, 2.5),
      new T.MeshBasicMaterial({ map: at, side: T.DoubleSide }),
    );
    sg.position.set(0, 7.4, 19.5);
    ven.add(sg);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 6.2832,
        x = Math.cos(a) * 20.8,
        z = Math.sin(a) * 20.8;
      if (z > 16 && Math.abs(x) < 9) continue;
      cyl(V(x, 0.6, z), V(x, 6, z), 0.09, 0.09, wood, ven);
      const l = new T.Mesh(new T.SphereGeometry(0.34, 10, 8), warm);
      l.position.set(x, 6.2, z);
      ven.add(l);
    }
  }

  return { ven, poolU };
}
