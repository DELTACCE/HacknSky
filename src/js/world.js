// HacknSky 3D world: procedural terrain, river, waterfall, forests, lodge, cable car, totems,
// in-world 3D captions, camera journey and the quality ladder. three.js comes from npm and is tree-shaken by the bundler.
import * as THREE from "three";
import { CONFIG, $, $$, ROOT, CH, TRACKS, Game, bootT0, loadout, show, boot, showError, failWorld, enter, setSquad, pad, track } from "./ui.js";
import { mountValleyDetails } from "./valley/ValleyDetails.jsx";

export async function startWorld() {
  show(30, "Loading fonts");
  { const f0 = getComputedStyle(document.body).fontFamily.split(",")[0].trim(); // fonts are part of the loader now, so the lettering never pops in late
    await Promise.race([Promise.all([600, 700, 800].map((w) => document.fonts.load(`${w} 100px ${f0}`))), new Promise((r) => setTimeout(r, 3500))]).catch(() => {}); show(37, "Loading fonts"); }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches || Math.min(screen.width, screen.height) < 700; // phones and small tablets get the lighter scene
  const canvas = $("#gl");
  const startDpr = Math.min(devicePixelRatio, coarse ? Math.min(2, Math.max(1.25, Math.sqrt(0.8e6 / (innerWidth * innerHeight)))) : 1.75); // phones: ~1 megapixel budget, never blurry
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !(coarse && startDpr >= 1.5), powerPreference: "high-performance" }); // multisampling is costly on phone GPUs; at 1.5x+ the ink outlines already hide jaggies
  renderer.setPixelRatio(startDpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = !coarse;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false; // re-rendered every few frames, not every frame

  const scene = new THREE.Scene();
  const SKY_HORIZON = new THREE.Color("#f3dcb4"), SKY_TOP = new THREE.Color("#8fb0c8");
  scene.fog = new THREE.FogExp2(0xe6d5b4, 0.0085);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 700);

  // ---- helpers ----------------------------------------------------------
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const C = (h) => new THREE.Color(h);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sm = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rand = mulberry(20270115);
  const hash2 = (ix, iz) => { let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vnoise = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const fbm = (x, z, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, z * f); f *= 2; a *= 0.5; } return s; };

  // ---- toon / anime shading: banded light, smooth blobs, ink outlines ------
  const gradMap = (() => { const t = new THREE.DataTexture(new Uint8Array([70, 130, 205, 255]), 4, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
  const toonMat = (o = {}) => { const { flatShading, ...r } = o; return new THREE.MeshToonMaterial({ gradientMap: gradMap, ...r }); };
  const INK = "#1b1712";
  function smoothGeo(src) { // same triangles, normals averaged over shared corners (so an inverted hull has no gaps)
    const g = src.index ? src.toNonIndexed() : src.clone(), p = g.attributes.position, acc = new Map();
    for (const a of ["color", "uv", "normal"]) if (g.attributes[a]) g.deleteAttribute(a);
    const key = (i) => Math.round(p.getX(i) * 300) + "_" + Math.round(p.getY(i) * 300) + "_" + Math.round(p.getZ(i) * 300);
    const a = V3(0, 0, 0), b = V3(0, 0, 0), c = V3(0, 0, 0), n = V3(0, 0, 0), keys = [];
    for (let i = 0; i < p.count; i++) keys.push(key(i));
    for (let i = 0; i < p.count; i += 3) { a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      n.copy(b).sub(a).cross(c.clone().sub(a)); for (let k = 0; k < 3; k++) { const e = acc.get(keys[i + k]) || [0, 0, 0]; e[0] += n.x; e[1] += n.y; e[2] += n.z; acc.set(keys[i + k], e); } }
    const nor = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const e = acc.get(keys[i]), l = Math.hypot(e[0], e[1], e[2]) || 1; nor[i * 3] = e[0] / l; nor[i * 3 + 1] = e[1] / l; nor[i * 3 + 2] = e[2] / l; }
    g.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); return g;
  }
  const outlineMat = (th, color = INK) => { const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
    m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace("#include <begin_vertex>", "vec3 transformed = position + normalize(normal) * " + th.toFixed(3) + ";"); };
    m.customProgramCacheKey = () => "ink" + th; return m; };
  const outlines = []; // every ink-outline hull, so a slow device can switch them all off at once
  const addOutline = (mesh, th = 0.07) => { const o = new THREE.Mesh(smoothGeo(mesh.geometry), outlineMat(th)); mesh.add(o); outlines.push(o); return o; };

  // ---- world layout -----------------------------------------------------
  const FALL_Z = -34, PLATEAU = 22, VALLEY = 3.5;
  const riverX = (z) => 2.5 * Math.sin(z * 0.06) + 1.5 * Math.sin(z * 0.13 + 1);
  const levelAt = (z) => lerp(PLATEAU, VALLEY, sm(FALL_Z - 3, FALL_Z + 3, z)); // bank level along the river
  function groundY(x, z) {
    const step = sm(FALL_Z - 3, FALL_Z + 3, z);
    let h = lerp(PLATEAU, VALLEY, step);
    const dr = Math.abs(x - riverX(z));
    const bank = sm(8, 2.6, dr); // 1 in the channel, 0 away from it
    h += (fbm(x * 0.045 + 10, z * 0.045 + 3) - 0.5) * 9 * (0.45 + 0.55 * step) * (1 - bank * 0.95);
    // canyon walls and the high country behind the plateau
    h += sm(34, 92, Math.abs(x)) * (20 + fbm(x * 0.03, z * 0.03 + 50) * 16);
    h += sm(-72, -140, z) * (14 + fbm(x * 0.05, z * 0.05) * 18) * sm(6, 22, dr); // the river keeps its own valley through the high country
    // rocky roughness on the cliff face
    const face = 1 - Math.abs(step - 0.5) * 2;
    h += (fbm(x * 0.2, z * 0.2 + 9) - 0.5) * 2.4 * Math.max(0, face);
    h -= bank * 3.2;
    const fzone = sm(FALL_Z - 7, FALL_Z - 3, z) * (1 - sm(FALL_Z + 4, FALL_Z + 8, z)), trench = sm(5.8, 4.4, dr) * fzone; // smooth notch the falls drop through
    h = lerp(h, Math.min(h, lerp(PLATEAU, VALLEY, step) - 3.8), trench);
    return h;
  }
  const waterY = (z) => levelAt(z) - 3.2 + 1.1;

  // keep-clear zones for scatter (x, z, radius)
  const POOL = { x: 30, z: -12 }, LODGE = { x: -16, z: -8 }, BRIDGE_Z = -6, DECK = { x: 34, z: -46 };
  const zones = [[LODGE.x, LODGE.z, 12], [POOL.x, POOL.z, 21], [DECK.x, DECK.z, 10.5], [LODGE.x - 9, LODGE.z - 12, 6], [-34, 6, 5], [-18, 20, 14]];
  const blocked = (x, z) => zones.some(([cx, cz, r]) => (x - cx) ** 2 + (z - cz) ** 2 < r * r);
  // flatten pads so buildings sit on level ground
  const pad2 = (x, z, cx, cz, r, h) => { const d = Math.hypot(x - cx, z - cz); return d < r ? 1 : 0; };
  const PADS = [[LODGE.x, LODGE.z, 11], [POOL.x, POOL.z, 18.5], [DECK.x, DECK.z, 8.6], [LODGE.x - 9, LODGE.z - 12, 4], [-34, 6, 4.5], [-18, 20, 9]];
  const rawGround = groundY;
  const padH = PADS.map(([x, z]) => rawGround(x, z));
  const ground = (x, z) => {
    let h = rawGround(x, z);
    for (let i = 0; i < PADS.length; i++) { const [cx, cz, r] = PADS[i]; const d = Math.hypot(x - cx, z - cz); const t = 1 - sm(r, r + 7, d); h = lerp(h, padH[i], t); }
    return h;
  };

  // ---- lights -----------------------------------------------------------
  const hemi = new THREE.HemisphereLight(0xfff1d6, 0x5f7a3a, 1.0); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe2b0, 2.2); sun.position.set(-50, 70, 40); scene.add(sun);
  if (renderer.shadowMap.enabled) {
    sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536);
    Object.assign(sun.shadow.camera, { left: -75, right: 75, top: 55, bottom: -55, near: 10, far: 220 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6; sun.target.position.set(0, 5, -10); scene.add(sun.target);
  }

  // ---- sky dome + sun ---------------------------------------------------
  const sky = new THREE.Mesh(new THREE.SphereGeometry(520, 24, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: SKY_TOP }, hor: { value: SKY_HORIZON }, sunDir: { value: sun.position.clone().normalize() } },
    vertexShader: "varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: "varying vec3 vP; uniform vec3 top,hor,sunDir; void main(){ vec3 d=normalize(vP); float h=smoothstep(-.05,.6,d.y); h=floor(h*6.)/6.; vec3 c=mix(hor,top,h); float s=max(dot(d,normalize(sunDir)),0.); c+=vec3(1.,.8,.45)*step(.985,s)*.22; c=mix(c,vec3(1.,.94,.72),step(.9988,s)); gl_FragColor=vec4(c,1.); }",
  }));
  sky.renderOrder = -10; scene.add(sky);

  await boot(14, "Shaping terrain");
  // ---- terrain ----------------------------------------------------------
  const TX0 = -110, TX1 = 110, TZ0 = -150, TZ1 = 80, NX = 150, NZ = 160;
  const tGeo = new THREE.PlaneGeometry(TX1 - TX0, TZ1 - TZ0, NX, NZ); tGeo.rotateX(-Math.PI / 2);
  { const p = tGeo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + (TX0 + TX1) / 2, z = p.getZ(i) + (TZ0 + TZ1) / 2; p.setXYZ(i, x, ground(x, z), z); } }
  tGeo.computeVertexNormals(); // indexed + smooth: a third of the vertices, and soft toon contours instead of boxy facets
  { const p = tGeo.attributes.position, nrm = tGeo.attributes.normal, col = new Float32Array(p.count * 3), uv = new Float32Array(p.count * 2), tmp = C("#000"), tmp2 = C("#000");
    const gA = C("#5c9a34"), gB = C("#8cc455"), gHi = C("#4a8a4a"), dirt = C("#b48e56"), dirt2 = C("#9c7842"), rock = C("#8f8c82"), sand = C("#d2bd82");
    const strata = [C("#c58b50"), C("#a8703c"), C("#d19a5c"), C("#946134")];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ny = nrm.getY(i), dr = Math.abs(x - riverX(z));
      uv[i * 2] = x * 0.085; uv[i * 2 + 1] = z * 0.085;
      // meadow: two greens drifting with low-frequency noise, cooler on the high ground
      tmp.copy(gA).lerp(gB, sm(0.35, 0.7, fbm(x * 0.05 + 7, z * 0.05 + 2)));
      tmp.lerp(gHi, sm(14, 38, y) * 0.55); tmp.multiplyScalar(0.94 + fbm(x * 0.4, z * 0.4) * 0.12);
      // worn dirt trails and bare patches on the gentle ground
      const dp = sm(0.6, 0.72, fbm(x * 0.07 + 30, z * 0.07 + 11)) * sm(0.8, 0.95, ny) * (1 - sm(20, 36, y)); tmp.lerp(tmp2.copy(dirt).lerp(dirt2, fbm(x * 0.3, z * 0.3)), dp * 0.85);
      // sandy banks next to the water
      tmp.lerp(sand, (1 - sm(5, 9, dr)) * sm(levelAt(z) - 0.6, levelAt(z) - 2.4, y) * 0.9);
      // cliffs: horizontal strata bands that wobble, darker toward the base
      const cf = sm(0.8, 0.52, ny), band = Math.floor((y * 0.55 + fbm(x * 0.08, z * 0.08) * 3.2) % 4 + 4) % 4;
      tmp2.copy(strata[band]).lerp(strata[(band + 1) % 4], 0.35).multiplyScalar(0.82 + 0.25 * sm(2, 22, y)); tmp.lerp(tmp2, cf);
      tmp.lerp(rock, sm(40, 55, y) * (0.4 + 0.5 * cf));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    tGeo.setAttribute("color", new THREE.BufferAttribute(col, 3)); tGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  }
  // tileable painterly detail map: soft blotches and tiny blade flecks, multiplied over the vertex colours
  const detailTex = (() => { const S = 256, cv = document.createElement("canvas"); cv.width = cv.height = S; const x = cv.getContext("2d"), rr = mulberry(4242);
    x.fillStyle = "#ececec"; x.fillRect(0, 0, S, S); const wrap = (fn) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) fn(ox, oy); };
    for (let i = 0; i < 190; i++) { const px = rr() * S, py = rr() * S, r = 12 + rr() * 30, l = rr() < 0.5 ? 255 : 196, al = 0.16 + rr() * 0.14;
      wrap((ox, oy) => { const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r); g.addColorStop(0, `rgba(${l},${l},${l},${al})`); g.addColorStop(1, `rgba(${l},${l},${l},0)`); x.fillStyle = g; x.fillRect(px + ox - r, py + oy - r, r * 2, r * 2); }); }
    x.lineCap = "round"; for (let i = 0; i < 1100; i++) { const px = rr() * S, py = rr() * S, h = 3 + rr() * 6, dx = (rr() - 0.5) * 4; x.strokeStyle = rr() < 0.5 ? "rgba(150,150,150,.38)" : "rgba(255,255,255,.55)"; x.lineWidth = 1.1;
      wrap((ox, oy) => { x.beginPath(); x.moveTo(px + ox, py + oy); x.lineTo(px + ox + dx, py + oy - h); x.stroke(); }); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
  const terrain = new THREE.Mesh(tGeo, toonMat({ vertexColors: true, map: detailTex }));
  terrain.receiveShadow = true; scene.add(terrain);

  // ---- tiny geometry merger (so we don't need BufferGeometryUtils) -------
  function merge(parts, smooth = false) { // parts: [{g, m (Matrix4), c (hex)}]
    const pos = [], col = [], nor = [];
    for (const { g, m, c } of parts) {
      const ng = g.index ? g.toNonIndexed() : g.clone(); ng.applyMatrix4(m);
      const p = ng.attributes.position, color = C(c);
      const nn = ng.attributes.normal; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); col.push(color.r, color.g, color.b); if (smooth && nn) nor.push(nn.getX(i), nn.getY(i), nn.getZ(i)); }
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    if (smooth) out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); else out.computeVertexNormals(); return out;
  }
  const M4 = (x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, ry = 0, rz = 0, rx = 0) => new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V3(sx, sy, sz));
  const litMat = toonMat({ vertexColors: true, flatShading: true });
  const shadowed = (m, cast = true, recv = false) => { m.castShadow = cast && renderer.shadowMap.enabled; m.receiveShadow = recv; return m; };

  await boot(30, "Carving the river");
  // ---- water (river, waterfall and pool share one shader) ---------------
  const waterUniforms = { time: { value: 0 } }, RIB = { Z0: -146, STEP: 0.8, A: 136, B: 145, run: [], f: [] }; // ribbon rows A..B are replaced by the falls curtain
  const waterMat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, waterUniforms]),
    vertexShader: `attribute float flow; varying vec2 vUv; varying float vFlow;
      #include <fog_pars_vertex>
      void main(){ vUv=uv; vFlow=flow; vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform float time; varying vec2 vUv; varying float vFlow;
      #include <fog_pars_fragment>
      float h(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); } // sin-free hash: stays smooth however long the page has been open
      float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){
        float sp=mix(.5,5.,vFlow);
        vec2 p=vec2(vUv.x*3.5,vUv.y*mix(.35,.12,vFlow)-time*sp*.30);
        float a=n(p), b=n(p*vec2(2.1,1.6)+7.);
        float st=n(vec2(vUv.x*11.,vUv.y*.10-time*sp*.45));
        float foam=smoothstep(.62,.68,a*.6+b*.4)*.8+smoothstep(.70,.76,st)*vFlow*.9;
        vec3 deep=vec3(.16,.55,.85), light=vec3(.40,.80,.95);
        vec3 c=mix(deep,light,smoothstep(.44,.50,a));
        c=mix(c,vec3(1.),clamp(foam+vFlow*.12,0.,1.));
        float edge=smoothstep(0.,.1,vUv.x)*(1.-smoothstep(.9,1.,vUv.x));
        c=mix(vec3(.95,.98,1.),c,edge);
        gl_FragColor=vec4(c,1.);
        #include <fog_fragment>
      }`,
  });
  waterMat.uniforms.time = waterUniforms.time; // UniformsUtils.merge clones values: re-link so the clock actually reaches the shader
  { // river ribbon following the carved channel, steep over the falls
    const HALF = 4.4, STEP = RIB.STEP, Z0 = RIB.Z0, Z1 = 70, n = Math.ceil((Z1 - Z0) / STEP), ys = [];
    for (let i = 0; i <= n; i++) { const z = Z0 + i * STEP; ys.push(waterY(z) + 0.55 * Math.max(0, 1 - Math.abs(sm(FALL_Z - 3, FALL_Z + 3, z) - 0.5) * 2)); }
    const pos = [], uv = [], flow = [], idx = []; let run = 0;
    for (let i = 0; i <= n; i++) {
      const z = Z0 + i * STEP, cx = riverX(z), y = ys[i], i0 = Math.max(0, i - 3), i1 = Math.min(n, i + 3);
      const f = sm(0.15, 1.2, Math.abs(ys[i1] - ys[i0]) / ((i1 - i0) * STEP)); // slope read over a wide window so the flow value eases in at the lip instead of jumping
      if (i > 0) run += STEP * (1 + f * 1.5);
      RIB.run[i] = run; RIB.f[i] = f;
      pos.push(cx - HALF, y, z, cx + HALF, y, z); uv.push(0, run, 1, run); flow.push(f, f);
      if (i < n && !(i >= RIB.A && i < RIB.B)) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("flow", new THREE.Float32BufferAttribute(flow, 1)); g.setIndex(idx);
    scene.add(new THREE.Mesh(g, waterMat));
  }

  // ---- waterfall curtain: continuous with the river mesh, with Fiber detail layered over it
  let curtain;
  {
    // same material, width and flow as the river so the falls read as the river itself tipping over the edge
    const HALFW = 4.4, COLS = 12, ROWS = 44, ZA = RIB.Z0 + RIB.A * RIB.STEP, ZB = RIB.Z0 + RIB.B * RIB.STEP, pos = [], uv = [], fl = [], idx = []; let run = RIB.run[RIB.A], pz = 0, py = 0;
    const bump = (z) => 0.55 * Math.max(0, 1 - Math.abs(sm(FALL_Z - 3, FALL_Z + 3, z) - 0.5) * 2); // identical lift the river ribbon uses at the lip
    for (let j = 0; j <= ROWS; j++) { const s = j / ROWS, z = lerp(ZA, ZB, s), k = (waterY(z + 0.1) - waterY(z - 0.1)) / 0.2, nl = Math.hypot(k, 1), off = 1.0 * Math.pow(Math.sin(Math.PI * s), 1.4);
      const cx = riverX(z), zz = z + (-k / nl) * off, yy = waterY(z) + bump(z) + (1 / nl) * off, f = (RIB.f[RIB.A] * (1 - s) + s) * (1 - sm(0.8, 1, s) * (1 - RIB.f[RIB.B]));
      if (j > 0) run += Math.hypot(zz - pz, yy - py) * (1 + f * 1.5); pz = zz; py = yy;
      for (let i = 0; i <= COLS; i++) { const u = i / COLS; pos.push(cx + (u - 0.5) * 2 * HALFW, yy, zz); uv.push(u, run); fl.push(f); } }
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) { const a = j * (COLS + 1) + i, b = a + COLS + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("flow", new THREE.Float32BufferAttribute(fl, 1)); g.setIndex(idx);
    curtain = new THREE.Mesh(g, waterMat); curtain.frustumCulled = false; scene.add(curtain);
  }

  // ---- mist at the foot of the falls + drifting fireflies ----------------
  function softTex() { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  const soft = softTex();
  const MIST_N = reduced ? 16 : coarse ? 10 : 46, mistBase = [];
  const mistGeo = new THREE.BufferGeometry(), mistPos = new Float32Array(MIST_N * 3);
  for (let i = 0; i < MIST_N; i++) mistBase.push({ x: riverX(FALL_Z) + (rand() - 0.5) * 12, y: VALLEY - 1.5 + rand() * 6, z: FALL_Z + 3 + rand() * 6, p: rand() * 6.28, s: 0.4 + rand() * 0.8 });
  mistGeo.setAttribute("position", new THREE.BufferAttribute(mistPos, 3));
  const mist = new THREE.Points(mistGeo, new THREE.PointsMaterial({ map: soft, size: coarse ? 7 : 11, transparent: true, opacity: 0.34, depthWrite: false, color: 0xffffff, sizeAttenuation: true }));
  mist.frustumCulled = false; scene.add(mist);

  const FF_N = coarse ? 40 : 90, ffGeo = new THREE.BufferGeometry(), ffPos = new Float32Array(FF_N * 3), ffBase = [];
  for (let i = 0; i < FF_N; i++) { const x = (rand() - 0.5) * 120, z = -40 + rand() * 90; ffBase.push({ x, y: ground(x, z) + 1.5 + rand() * 5, z, p: rand() * 6.28 }); }
  ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPos, 3));
  const fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({ map: soft, size: 1.4, transparent: true, opacity: 0.9, depthWrite: false, color: 0xe7ff7a, blending: THREE.AdditiveBlending }));
  fireflies.frustumCulled = false; scene.add(fireflies);

  await boot(44, "Planting forests");
  // ---- forests (instanced, toon-shaded with ink outlines) ----------------------------------
  const pineGeo = merge([
    { g: new THREE.CylinderGeometry(0.22, 0.38, 2.4, 7), m: M4(0, 1.2, 0), c: "#6b4a2b" },
    { g: new THREE.ConeGeometry(2.3, 2.8, 9), m: M4(0, 2.9, 0, 1, 1, 1, 0.2), c: "#2e6f4a" },
    { g: new THREE.ConeGeometry(1.9, 2.6, 9), m: M4(0.05, 4.5, 0, 1, 1, 1, 0.6), c: "#3b8452" },
    { g: new THREE.ConeGeometry(1.45, 2.4, 9), m: M4(0, 6.0, 0, 1, 1, 1, 1.0), c: "#4a9a58" },
    { g: new THREE.ConeGeometry(0.95, 2.2, 9), m: M4(0, 7.4, 0, 1, 1, 1, 1.4), c: "#62b45f" },
  ], true);
  const roundGeo = merge([
    { g: new THREE.CylinderGeometry(0.28, 0.5, 3.2, 7), m: M4(0, 1.6, 0), c: "#6e4a2a" },
    { g: new THREE.CylinderGeometry(0.14, 0.24, 1.8, 6), m: M4(0.7, 3.6, 0.1, 1, 1, 1, 0, -0.7), c: "#6e4a2a" },
    { g: new THREE.IcosahedronGeometry(2.3, 1), m: M4(0, 4.7, 0, 1, 0.88, 1), c: "#4f9a3c" },
    { g: new THREE.IcosahedronGeometry(1.7, 1), m: M4(-1.8, 4.2, 0.5), c: "#5aa843" },
    { g: new THREE.IcosahedronGeometry(1.8, 1), m: M4(1.7, 4.5, -0.5), c: "#63b24a" },
    { g: new THREE.IcosahedronGeometry(1.5, 1), m: M4(0.1, 6.2, 0.3), c: "#7ac857" },
    { g: new THREE.IcosahedronGeometry(1.2, 1), m: M4(-0.6, 5.7, 1.5), c: "#8fd860" },
  ], true);
  const bushGeo = merge([{ g: new THREE.IcosahedronGeometry(1.5, 1), m: M4(0, 1.0, 0, 1, 0.85, 1), c: "#ffffff" }, { g: new THREE.IcosahedronGeometry(1.0, 1), m: M4(1.0, 0.8, 0.5), c: "#f4f4f4" }], true);
  const trees = { pine: [], round: [], bush: [] };
  const slopeAt = (x, z) => Math.max(Math.abs(ground(x + 1, z) - ground(x - 1, z)), Math.abs(ground(x, z + 1) - ground(x, z - 1))) / 2;
  const okSpot = (x, z) => !blocked(x, z) && Math.abs(x - riverX(z)) > 7.5 && slopeAt(x, z) < 0.55 && !(z > BRIDGE_Z - 4 && z < BRIDGE_Z + 4 && Math.abs(x) < 14);
  const occ = new Map(), CELL = 6;
  const free = (x, z, d) => { const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = occ.get((cx + i) + "," + (cz + j)); if (a) for (const [ax, az] of a) if ((ax - x) ** 2 + (az - z) ** 2 < d * d) return false; } return true; };
  const mark = (x, z) => { const k = Math.floor(x / CELL) + "," + Math.floor(z / CELL); if (!occ.has(k)) occ.set(k, []); occ.get(k).push([x, z]); };
  const TREE_MAX = coarse ? 260 : 560; let placed = 0;
  for (let i = 0; i < 40000 && placed < TREE_MAX; i++) { // loose groves with open meadows between, never shoulder to shoulder
    const x = TX0 + 12 + rand() * (TX1 - TX0 - 24), z = -140 + rand() * 195; if (!okSpot(x, z)) continue;
    const g = fbm(x * 0.03 + 3, z * 0.03 + 8), far = Math.abs(x) > 42 || z < -60;
    if (rand() > sm(0.44, 0.62, g) * (far ? 1 : 0.85) + (far ? 0.1 : 0.04)) continue;
    const s = 0.75 + rand() * 0.8; if (!free(x, z, 3.7 + s * 1.5)) continue; mark(x, z); placed++;
    const kind = rand() < 0.2 + 0.25 * sm(60, -20, ground(x, z)) ? "round" : "pine"; trees[kind].push([x, ground(x, z), z, s, rand() * 6.28]);
  }
  for (let i = 0; i < 170; i++) { // autumn bushes crowding the base of the falls and the banks
    const a = rand() * 6.28, r = 4 + rand() * 20, x = riverX(FALL_Z) + Math.cos(a) * r * 1.2, z = FALL_Z + 8 + Math.sin(a) * r * 0.8 + 6;
    if (Math.abs(x - riverX(z)) < 6 || blocked(x, z)) continue; trees.bush.push([x, ground(x, z), z, 0.7 + rand() * 1.0, rand() * 6.28]);
  }
  const palette = { pine: ["#ffffff", "#f0f8e4", "#e2f0da", "#f7fff0"], round: ["#ffffff", "#f6f9d8", "#e6f0b8", "#fff0c0"], bush: ["#d9622f", "#e68b3a", "#c9c24a", "#a9b04a", "#bf4e3a", "#d4a63a", "#8a9c4a"] };
  const treeSets = [], decor = []; // decor: grass and flower instances (switched off on slow devices)
  function instance(geo, list, pal, th = 0.1) {
    if (!list.length) return; const im = new THREE.InstancedMesh(geo, litMat, list.length); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    list.forEach(([x, y, z, s, r], i) => { e.set(0, r, 0); q.setFromEuler(e); m.compose(V3(x, y, z), q, V3(s, s * (0.85 + hash2(i, 5) * 0.4), s)); im.setMatrixAt(i, m); im.setColorAt(i, C(pal[Math.floor(hash2(i, 9) * pal.length)])); });
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.castShadow = renderer.shadowMap.enabled; scene.add(im);
    const om = new THREE.InstancedMesh(smoothGeo(geo), outlineMat(th), list.length); om.instanceMatrix = im.instanceMatrix; scene.add(om); treeSets.push({ im, list, om });
  }
  // keep sight-lines to the in-world text free of trunks and canopies
  const zero = new THREE.Matrix4().makeScale(0, 0, 0), segP = V3(0, 0, 0), segD = V3(0, 0, 0), segQ = V3(0, 0, 0);
  function clearTrees(tubes) {
    for (const ts of treeSets) { let dirty = false;
      ts.list.forEach((t, i) => { if (t.cut) return; segP.set(t[0], t[1] + 3, t[2]);
        for (const { a, b, r0, r1 } of tubes) { segD.copy(b).sub(a); const L2 = segD.lengthSq(); let u = clamp(segQ.copy(segP).sub(a).dot(segD) / L2, 0, 1); const d = segQ.copy(a).addScaledVector(segD, u).distanceTo(segP);
          if (d < lerp(r0, r1, u)) { t.cut = true; ts.im.setMatrixAt(i, zero); dirty = true; break; } } });
      if (dirty) ts.im.instanceMatrix.needsUpdate = true; }
  }
  instance(pineGeo, trees.pine, palette.pine, 0.08); instance(roundGeo, trees.round, palette.round, 0.07); instance(bushGeo, trees.bush, palette.bush, 0.05);

  // grass tufts and meadow flowers: small instanced clumps that break up the flat ground
  { const bladeClump = () => { // 5 flat leaf blades per clump: wide at the base, curving over, pointed tip, light tips on dark roots
      const pos = [], col = [], nor = [], c0 = C("#4c8c34"), c1 = C("#a8de66"), tc = C("#000"), SEG = 3, N = 5;
      for (let b = 0; b < N; b++) { const a = b / N * 6.283 + b * 0.7, ca = Math.cos(a), sa = Math.sin(a), lean = 0.5 + (b % 2) * 0.35, h = 0.5 + ((b * 37) % 5) * 0.07, w = 0.13, ring = [];
        for (let s = 0; s <= SEG; s++) { const t = s / SEG, wd = w * Math.pow(1 - t, 0.8), r = 0.05 + lean * t * t * h * 0.9, y = h * t;
          ring.push([[ca * r - sa * wd, y, sa * r + ca * wd], [ca * r + sa * wd, y, sa * r - ca * wd], tc.copy(c0).lerp(c1, t).clone()]); }
        const tri = (p, q, r2, cp, cq, cr) => { for (const [v, c] of [[p, cp], [q, cq], [r2, cr]]) { pos.push(...v); col.push(c.r, c.g, c.b); nor.push(0, 1, 0); } };
        for (let s = 0; s < SEG; s++) { const [l0, r0, k0] = ring[s], [l1, r1, k1] = ring[s + 1]; tri(l0, r0, l1, k0, k0, k1); if (s < SEG - 1) tri(r0, r1, l1, k0, k1, k1); } }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); return g; };
    const tuftGeo = bladeClump(), grassMat = toonMat({ vertexColors: true, side: THREE.DoubleSide });
    const petals = []; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; petals.push({ g: new THREE.IcosahedronGeometry(0.1, 0), m: M4(Math.cos(a) * 0.14, 0.5, Math.sin(a) * 0.14, 1, 0.6, 1), c: "#ffffff" }); }
    const flowerGeo = merge([{ g: new THREE.CylinderGeometry(0.025, 0.03, 0.5, 5), m: M4(0, 0.25, 0), c: "#4f8a3a" }, ...petals, { g: new THREE.IcosahedronGeometry(0.1, 0), m: M4(0, 0.52, 0), c: "#ffd23f" }], true);
    const spots = (n, tries) => { const out = []; for (let i = 0; i < tries && out.length < n; i++) { const x = TX0 + 10 + rand() * (TX1 - TX0 - 20), z = -120 + rand() * 170; if (blocked(x, z) || Math.abs(x - riverX(z)) < 6.5) continue;
        const y = ground(x, z); if (y > 36 || slopeAt(x, z) > 0.45) continue; out.push([x, y, z, 0.8 + rand() * 0.7, rand() * 6.28]); } return out; };
    const mkInst = (geo, list, pal, mat = litMat) => { const im = new THREE.InstancedMesh(geo, mat, list.length), mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      list.forEach(([x, y, z, s, r], i) => { e.set(0, r, 0); q.setFromEuler(e); mm.compose(V3(x, y, z), q, V3(s, s, s)); im.setMatrixAt(i, mm); im.setColorAt(i, C(pal[Math.floor(hash2(i, 31) * pal.length)])); }); im.receiveShadow = false; scene.add(im); decor.push(im); };
    mkInst(tuftGeo, spots(coarse ? 600 : 1800, 9000), ["#ffffff", "#eef9d4", "#dff2b0", "#f6ffe0"], grassMat);
    mkInst(flowerGeo, spots(coarse ? 100 : 380, 4000), ["#ff9bbd", "#ffe066", "#ffffff", "#a8d4ff", "#ffb070"]); }

  // ---- building helpers ---------------------------------------------------
  const box = (L, w, h, d, x, y, z, c, ry = 0) => L.push({ g: new THREE.BoxGeometry(w, h, d), m: M4(x, y, z, 1, 1, 1, ry), c });
  const cyl = (L, r, h, x, y, z, c, seg = 8) => L.push({ g: new THREE.CylinderGeometry(r, r, h, seg), m: M4(x, y, z), c });
  const roof = (L, r, h, x, y, z, c, sx = 1, sz = 1) => L.push({ g: new THREE.ConeGeometry(r, h, 4), m: M4(x, y, z, sx, 1, sz, Math.PI / 4), c });
  const addMesh = (L, x = 0, y = 0, z = 0, cast = true, th = 0.07) => { const m = shadowed(new THREE.Mesh(merge(L), litMat), cast, true); addOutline(m, th); m.position.set(x, y, z); scene.add(m); return m; };

  await boot(62, "Raising the lodge");
  // lodge + cabins + campfire
  // gabled timber-frame building: stone plinth, framed walls, real roof slabs with overhang, windows with shutters and flower boxes, door, chimney
  const gableGeo = (span, h, len) => { const s = new THREE.Shape(); s.moveTo(-span / 2, 0); s.lineTo(span / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(-len / 2, 0, 0); return g; };
  const qY = new THREE.Quaternion(), qX = new THREE.Quaternion(), AXY = V3(0, 1, 0), AXX = V3(1, 0, 0);
  const MT = (x, y, z, yaw, tilt) => new THREE.Matrix4().compose(V3(x, y, z), qY.setFromAxisAngle(AXY, yaw).multiply(qX.setFromAxisAngle(AXX, tilt)), V3(1, 1, 1));
  function hall(L, cx, cz, rot, o) {
    const { len, span, wallH, roofH, wall = "#ecdcb8", roof = "#c4442a", trim = "#5e3f24", shutter = "#2f7f6f", ov = 0.9, win = 3, door = true, porch = false, chimney = true, doorX = 0 } = o;
    const co = Math.cos(rot), si = Math.sin(rot), P = (lx, ly, lz) => [cx + lx * co + lz * si, ly, cz - lx * si + lz * co];
    const put = (g, lx, ly, lz, c, tilt = 0, yaw = 0) => { const [x, y, z] = P(lx, ly, lz); L.push({ g, m: MT(x, y, z, yaw + rot, tilt), c }); };
    const bx = (w, hh, d, lx, ly, lz, c, tilt = 0) => put(new THREE.BoxGeometry(w, hh, d), lx, ly, lz, c, tilt);
    const y0 = 0.7 + wallH, half = span / 2 + ov, T = Math.atan(roofH / (span / 2)), slab = 0.34, rl = len + ov * 1.4;
    bx(len + 0.3, 0.7, span + 0.3, 0, 0.35, 0, "#9a9488");                                // stone plinth
    bx(len, wallH, span, 0, 0.7 + wallH / 2, 0, wall);                                    // walls
    put(gableGeo(span, roofH, len), 0, y0, 0, wall);                                      // gable-end attic block
    for (let lx = -len / 2 + 0.15; lx <= len / 2 - 0.1; lx += Math.max(1.8, len / Math.round(len / 2.4))) bx(0.26, wallH, span + 0.12, lx, 0.7 + wallH / 2, 0, trim); // framing posts
    bx(len + 0.1, 0.28, span + 0.1, 0, y0 - 0.14, 0, trim); bx(len + 0.1, 0.24, span + 0.1, 0, 0.82, 0, trim); // top and bottom beams
    for (const s of [-1, 1]) {                                                            // roof slabs, eave boards, gable windows
      bx(rl, slab, half / Math.cos(T), 0, y0 + roofH - (half / 2) * Math.tan(T) + slab / 2 / Math.cos(T), s * half / 2, roof, s * T);
      bx(rl, 0.2, 0.22, 0, y0 - ov * Math.tan(T) - 0.02, s * half, trim);
      bx(0.1, 0.95, 0.85, s * (len / 2 + 0.04), y0 + roofH * 0.42, 0, "#a9dcea"); bx(0.08, 1.1, 1.0, s * (len / 2 + 0.01), y0 + roofH * 0.42, 0, trim); }
    bx(rl + 0.2, 0.22, 0.5, 0, y0 + roofH + 0.12, 0, "#7a2f1e");                          // ridge cap
    const slots = []; for (let i = 0; i < win; i++) slots.push(-len / 2 + (len * (i + 0.5)) / win);
    for (const s of [-1, 1]) for (const lx of slots) { if (s === 1 && door && Math.abs(lx - doorX) < 1.9) continue; const wy = 0.7 + wallH * 0.56, fz = s * (span / 2 + 0.04);
      bx(1.5, 1.25, 0.14, lx, wy, fz, trim); bx(1.26, 1.0, 0.16, lx, wy, fz + s * 0.02, "#a9dcea"); bx(0.07, 1.0, 0.18, lx, wy, fz + s * 0.04, trim); bx(1.26, 0.07, 0.18, lx, wy, fz + s * 0.04, trim);
      for (const q of [-1, 1]) bx(0.5, 1.15, 0.1, lx + q * 0.98, wy, fz, shutter);
      bx(1.6, 0.25, 0.32, lx, wy - 0.78, fz + s * 0.2, "#6b4a2b"); for (let f = 0; f < 4; f++) L.push({ g: new THREE.IcosahedronGeometry(0.15, 0), m: M4(...P(lx - 0.55 + f * 0.37, wy - 0.58, fz + s * 0.2).map((v, i) => v), 1, 1, 1, 0, 0, 0), c: ["#ff9bbd", "#ffe066", "#ffffff", "#ff9bbd"][f] }); }
    if (door) { const fz = span / 2 + 0.05; bx(1.8, 2.7, 0.16, doorX, 0.7 + 1.35, fz, trim); bx(1.35, 2.4, 0.2, doorX, 0.7 + 1.2, fz + 0.03, "#7a4c28"); bx(0.1, 1.7, 0.22, doorX, 0.7 + 1.25, fz + 0.06, "#5a3a1d");
      bx(2.2, 0.26, 1.0, doorX, 0.13, fz + 0.55, "#b0aa9c"); bx(1.3, 0.5, 0.08, doorX + 1.45, 0.7 + 2.4, fz + 0.25, "#c6f04e");
      L.push({ g: new THREE.IcosahedronGeometry(0.22, 1), m: M4(...P(doorX - 1.35, 0.7 + 2.2, fz + 0.3), 1, 1, 1), c: "#ffd86a" }); }
    if (chimney) { bx(1.15, roofH + 1.8, 1.15, len * 0.27, y0 + (roofH + 1.8) / 2 - 0.2, -span * 0.2, "#a8a092"); bx(1.5, 0.26, 1.5, len * 0.27, y0 + roofH + 1.5, -span * 0.2, "#7d7668"); }
    if (porch) { const pw = 2.5, yTop = y0 - 0.4, yPost = 3.2, pt = Math.atan((yTop - yPost) / (pw + 0.3));
      bx(len + 0.5, 0.3, pw, 0, 0.15, span / 2 + pw / 2, "#9a6b3c"); bx(len + 0.9, 0.26, pw + 0.5, 0, (yTop + yPost) / 2 + 0.12, span / 2 + pw / 2 + 0.2, roof, pt);
      for (let lx = -len / 2 + 0.3; lx <= len / 2; lx += len / 6) { put(new THREE.CylinderGeometry(0.13, 0.13, yPost - 0.1, 6), lx, yPost / 2 + 0.1, span / 2 + pw - 0.15, "#7a5230"); bx(0.1, 0.1, 0.1, lx, 1.1, span / 2 + pw - 0.15, trim); }
      bx(len, 0.1, 0.12, 0, 1.2, span / 2 + pw - 0.15, "#6f4a2a"); }
  }
  { const gy = ground(LODGE.x, LODGE.z), L = [];
    hall(L, 0, 0, 0, { len: 13, span: 7, wallH: 3.6, roofH: 3.0, win: 4, doorX: 1.6, porch: true });
    for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) L.push({ g: new THREE.CylinderGeometry(0.34, 0.34, 2.0, 7), m: M4(-5.2 + k * 0.72, 0.5 + i * 0.6, 7.0 - (i % 2) * 0.1, 1, 1, 1, 0, 0, Math.PI / 2), c: i % 2 ? "#a87a46" : "#946834" }); // firewood stack
    L.push({ g: new THREE.CylinderGeometry(0.55, 0.5, 0.9, 10), m: M4(-6.8, 0.45, 7.2), c: "#7a5230" }, { g: new THREE.CylinderGeometry(0.56, 0.56, 0.12, 10), m: M4(-6.8, 0.92, 7.2), c: "#5e3f24" });
    addMesh(L, LODGE.x, gy, LODGE.z);
    const cabinSets = [[-14, -4, 0.3, "#eadcb9", "#c4442a"], [-14, 6, -0.2, "#e6d4ac", "#2f7f6f"], [-9, -12, 0.1, "#f0e2c2", "#d98a2b"]];
    for (const [dx, dz, ry, w, rc] of cabinSets) { const c = [], x = LODGE.x + dx, z = LODGE.z + dz; hall(c, 0, 0, ry, { len: 5.2, span: 4.2, wallH: 2.6, roofH: 2.1, ov: 0.7, win: 1, wall: w, roof: rc, doorX: 0, shutter: "#c4442a" }); addMesh(c, x, ground(x, z), z); }
    const fx = LODGE.x + 8, fz = LODGE.z + 11, fy = ground(fx, fz), f = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 5), new THREE.MeshBasicMaterial({ color: 0xffa233 }));
    f.position.set(fx, fy + 0.8, fz); scene.add(f);
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.35, 8), toonMat({ color: 0x6b6258, flatShading: true })); lg.position.set(fx, fy + 0.15, fz); scene.add(lg);
    var fireLight = new THREE.PointLight(0xff9a3c, 14, 16, 1.6); fireLight.position.set(fx, fy + 1.6, fz); scene.add(fireLight); var fireMesh = f; if (coarse) fireLight.visible = false; // a dynamic light costs every lit pixel on a phone; the flame itself stays
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 5), new THREE.MeshBasicMaterial({ color: 0xffe066 })); inner.position.y = -0.18; f.add(inner);
    const Lf = []; for (let i = 0; i < 11; i++) { const a = (i / 11) * 6.283; Lf.push({ g: new THREE.IcosahedronGeometry(0.36, 0), m: M4(Math.cos(a) * 1.5, 0.2, Math.sin(a) * 1.5, 1, 0.8, 1, i), c: i % 2 ? "#8d887c" : "#a39e92" }); }
    for (const a of [0.4, 2.2, 4.0, 5.4]) Lf.push({ g: new THREE.CylinderGeometry(0.3, 0.3, 2.4, 8), m: M4(Math.cos(a) * 3.3, 0.35, Math.sin(a) * 3.3, 1, 1, 1, -a, 0, Math.PI / 2), c: "#8a5e34" });
    for (const a of [0.8, 2.6]) Lf.push({ g: new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6), m: M4(0, 0.32, 0, 1, 1, 1, a, 0, Math.PI / 2), c: "#4a3320" });
    addMesh(Lf, fx, fy, fz, true, 0.05); }

  // bridge across the river
  { const cx = riverX(BRIDGE_Z), L = [], by = Math.max(ground(cx - 7.5, BRIDGE_Z), ground(cx + 7.5, BRIDGE_Z)) + 0.35;
    for (let i = -7.2; i <= 7.3; i += 0.9) box(L, 0.78, 0.22, 3.2, i, 0, 0, i % 2 ? "#a8743f" : "#b98150");
    for (const s of [-1.55, 1.55]) { box(L, 15.4, 0.16, 0.18, 0, 1.1, s, "#6f4a2a"); box(L, 15.4, 0.16, 0.18, 0, 0.55, s, "#6f4a2a"); for (const i of [-7.5, -3.75, 0, 3.75, 7.5]) box(L, 0.22, 1.3, 0.22, i, 0.6, s, "#5e3f24"); }
    for (const i of [-6, 0, 6]) for (const s of [-1.2, 1.2]) cyl(L, 0.25, 6, i, -3, s, "#5e3f24", 6);
    addMesh(L, cx, by, BRIDGE_Z, true, 0.035); }

  // water park: lazy-river ring, island with a splash pool, cabanas, umbrellas, palms and a twin-slide tower
  { const gy = ground(POOL.x, POOL.z), PX = POOL.x, PZ = POOL.z, L = [];
    const ringSolid = (r0, r1, h, c, y = 0) => { const sh = new THREE.Shape(); sh.absarc(0, 0, r1, 0, Math.PI * 2, false);
      if (r0 > 0) { const hole = new THREE.Path(); hole.absarc(0, 0, r0, 0, Math.PI * 2, true); sh.holes.push(hole); }
      const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 40 }); g.rotateX(-Math.PI / 2); L.push({ g, m: M4(0, y, 0), c }); };
    const polar = (r, a) => [Math.cos(a) * r, Math.sin(a) * r];
    L.push({ g: new THREE.CylinderGeometry(13.7, 13.7, 0.25, 40), m: M4(0, 0.12, 0), c: "#7fd0cf" }); // pool floor under the water
    ringSolid(14.4, 18.0, 0.3, "#e8d5a2");                       // sun-deck plaza
    ringSolid(13.6, 14.4, 1.0, "#f4ead0");                       // outer curb of the lazy river
    ringSolid(10.2, 10.6, 1.0, "#f4ead0");                       // inner curb
    ringSolid(4.9, 10.2, 1.0, "#ecdcaa"); ringSolid(7.2, 7.9, 1.03, "#e8644a"); ringSolid(8.6, 9.0, 1.03, "#3aa7e0"); // island deck + tile stripes
    ringSolid(4.5, 4.9, 1.2, "#f4ead0");                         // splash-pool curb
    L.push({ g: new THREE.CylinderGeometry(4.5, 4.5, 0.3, 28), m: M4(0, 0.15, 0), c: "#7fd0cf" });
    // mushroom fountain in the splash pool
    L.push({ g: new THREE.CylinderGeometry(0.28, 0.4, 2.6, 8), m: M4(0, 1.3, 0), c: "#f4ead0" }, { g: new THREE.CylinderGeometry(2.0, 0.3, 0.55, 12), m: M4(0, 2.8, 0), c: "#c6f04e" }, { g: new THREE.CylinderGeometry(1.3, 2.0, 0.25, 12), m: M4(0, 2.45, 0), c: "#3aa7e0" });
    // cabanas, umbrellas, loungers and beach balls on the island
    [0.5, 2.3, 4.1].forEach((a, i) => { const [x, z] = polar(8.0, a), col = ["#e8644a", "#3aa7e0", "#f2b134"][i];
      for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) L.push({ g: new THREE.CylinderGeometry(0.12, 0.12, 2.6, 6), m: M4(x + dx, 2.3, z + dz), c: "#fff5dc" });
      roof(L, 2.9, 1.5, x, 4.35, z, col, 1, 1); box(L, 2.2, 0.35, 1.0, x, 1.3, z, "#fff5dc"); });
    [1.4, 3.2, 5.0, 5.8].forEach((a, i) => { const [x, z] = polar(6.4 + (i % 2) * 2.2, a), col = ["#c6f04e", "#ffffff", "#3aa7e0", "#e8644a"][i];
      L.push({ g: new THREE.CylinderGeometry(0.06, 0.06, 2.8, 6), m: M4(x, 2.4, z), c: "#fff5dc" }, { g: new THREE.ConeGeometry(1.7, 0.75, 10), m: M4(x, 3.9, z), c: col });
      box(L, 0.9, 0.18, 2.0, x + 0.9, 1.15, z, "#ffffff", -a); box(L, 0.9, 0.18, 0.7, x + 0.9, 1.5, z - 1.0, "#ffffff", -a); });
    [[6, 6], [-5, 7.5], [-8, -2.5]].forEach(([x, z], i) => L.push({ g: new THREE.IcosahedronGeometry(0.5, 1), m: M4(x, 1.55, z), c: ["#e8644a", "#c6f04e", "#3aa7e0"][i] }));
    // entrance arch facing the camera side
    { const [x, z] = polar(16.2, 2.1); for (const s of [-1, 1]) L.push({ g: new THREE.CylinderGeometry(0.3, 0.35, 5.2, 8), m: M4(x + s * 2.6, 2.6, z), c: "#fff5dc" });
      box(L, 6.6, 0.9, 0.7, x, 5.5, z, "#c6f04e"); box(L, 5.2, 0.5, 0.75, x, 5.5, z, "#0b3b30"); L.push({ g: new THREE.ConeGeometry(0.5, 1.0, 4), m: M4(x, 6.5, z, 1, 1, 1, Math.PI / 4), c: "#e8644a" }); }
    addMesh(L, PX, gy, PZ);
    // water: moving turquoise rings and ripples (the shader clock is shared with the river)
    const poolMat = (ring) => { const mt = new THREE.ShaderMaterial({ fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { time: { value: 0 }, ringMode: { value: ring ? 1 : 0 } }]),
      vertexShader: `varying vec2 vP;
        #include <fog_pars_vertex>
        void main(){ vP=position.xy; vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
        }`,
      fragmentShader: `uniform float time; uniform float ringMode; varying vec2 vP;
        #include <fog_pars_fragment>
        float h(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); } // sin-free hash: stays smooth however long the page has been open
        float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
        void main(){
          float r=length(vP), a=atan(vP.y,vP.x);
          float rip=sin(r*2.4-time*1.8+n(vP*.6)*3.)*.5+.5;
          float st=n(vec2(a*16.-time*1.1*ringMode+n(vec2(r,time*.2))*2.,r*1.1));
          float foam=step(.8,st*.65+rip*.35)*(.55+.45*ringMode);
          vec3 deep=vec3(.10,.70,.82), light=vec3(.46,.94,.96);
          vec3 c=mix(deep,light,step(.55,rip*.55+st*.45));
          c=mix(c,vec3(1.),foam);
          gl_FragColor=vec4(c,1.);
          #include <fog_fragment>
        }` }); mt.uniforms.time = waterUniforms.time; return mt; };
    const lazy = new THREE.Mesh(new THREE.RingGeometry(10.6, 13.6, 72, 1), poolMat(true)); lazy.rotation.x = -Math.PI / 2; lazy.position.set(PX, gy + 0.6, PZ); scene.add(lazy);
    const splash = new THREE.Mesh(new THREE.CircleGeometry(4.5, 40), poolMat(false)); splash.rotation.x = -Math.PI / 2; splash.position.set(PX, gy + 0.8, PZ); scene.add(splash);
    // slide tower on the far side of the park, two tube slides spiralling down into the lazy river
    const A0 = -0.6, [tdx, tdz] = polar(15.8, A0), tx = PX + tdx, tz = PZ + tdz, tgy = ground(tx, tz), T = [];
    for (const [dx, dz] of [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]]) { box(T, 0.38, 15, 0.38, dx, 7.5, dz, "#efe3c4"); T.push({ g: new THREE.CylinderGeometry(0.12, 0.12, 2.4, 6), m: M4(dx, 16.0, dz), c: "#fff5dc" }); }
    box(T, 4.9, 0.35, 4.9, 0, 14.9, 0, "#a8743f"); roof(T, 4.6, 2.4, 0, 18.4, 0, "#c6f04e"); box(T, 4.9, 0.12, 0.12, 0, 15.9, -2.45, "#a8743f"); box(T, 4.9, 0.12, 0.12, 0, 15.9, 2.45, "#a8743f");
    for (let k = 0; k < 15; k++) { const a = k * 0.55; box(T, 1.5, 0.22, 0.85, Math.cos(a) * 3.0, 0.6 + k * 0.98, Math.sin(a) * 3.0, "#d6b27a", -a); }
    addMesh(T, tx, tgy, tz, true, 0.06);
    const mk = (da, dr, color) => { const pts = [], S = [];
      for (let i = 0; i <= 56; i++) { const t = i / 56, tt = t * (1.12 - 0.12 * t), a = A0 + da + t * 2.6, r = lerp(15.8, 12.1, sm(0, 1, t)) + dr;
        pts.push(V3(PX + Math.cos(a) * r, gy + lerp(14.5, 1.35, tt), PZ + Math.sin(a) * r)); }
      const tube = shadowed(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 1.1, 10, false), toonMat({ color }))); addOutline(tube, 0.09); scene.add(tube);
      for (let i = 4; i < 52; i += 5) { const p = pts[i], g0 = ground(p.x, p.z); if (p.y - g0 > 2) cyl(S, 0.24, p.y - g0 - 0.9, p.x, g0 + (p.y - g0 - 0.9) / 2, p.z, "#efe3c4", 6); } addMesh(S, 0, 0, 0, true, 0.05); };
    mk(0, 0.0, 0xc6f04e); mk(0.24, 0.9, 0x3aa7e0);
    const palm = (x, z, s = 1) => { const L2 = [], y0 = ground(x, z); let px = 0, py = 0;
      for (let i = 0; i < 6; i++) { const bx = px + 0.12 * i * s, by = py + 1.5 * s; L2.push({ g: new THREE.CylinderGeometry(0.28 * s, 0.34 * s, 1.6 * s, 6), m: M4(bx, by - 0.75 * s, 0, 1, 1, 1, 0, -0.08 * i), c: "#8a6a44" }); px = bx; py = by; }
      for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; L2.push({ g: new THREE.BoxGeometry(3.6 * s, 0.08, 0.7 * s), m: M4(px + Math.cos(a) * 1.5 * s, py + 0.1 * s, Math.sin(a) * 1.5 * s, 1, 1, 1, -a, -0.35), c: k % 2 ? "#4f8a3a" : "#5f9a40" }); }
      addMesh(L2, x, y0, z, true, 0.03); };
    [0.2, 1.0, 1.6, 2.6, 3.3, 4.2, 5.0, 5.7].forEach((a, i) => { const [dx, dz] = polar(16.4, a); if (Math.abs(a - 2.1) > 0.35 && Math.abs(a - (A0 + 6.283)) > 0.5) palm(PX + dx, PZ + dz, 1.0 + (i % 3) * 0.15); }); }

  await boot(76, "Stringing the cable car");
  // ---- cable car ----------------------------------------------------------
  const STN_RY = 0.3, CA = V3(-34 - 2.6 * Math.cos(STN_RY), ground(-34, 6) + 11, 6 + 2.6 * Math.sin(STN_RY)), CB = V3(DECK.x - 6.2, ground(DECK.x, DECK.z) + 14.2, DECK.z);
  const ARM_RY = Math.atan2(-(CB.z - CA.z), CB.x - CA.x); // cross-arms sit square to the line
  const cableAt = (t, o = 0) => { const p = CA.clone().lerp(CB, t); p.y -= 3.4 * 4 * t * (1 - t); if (o) { const d = CB.clone().sub(CA); const n = V3(-d.z, 0, d.x).normalize(); p.addScaledVector(n, o); } return p; };
  const LINE = 3.2; for (const o of [-LINE, LINE]) { const pts = []; for (let i = 0; i <= 30; i++) pts.push(cableAt(i / 30, o)); scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.09, 5), toonMat({ color: 0x1b2420 }))); }
  { const dn = CB.clone().sub(CA).setY(0).normalize(), nx = -dn.z, nz = dn.x; // mid-line pylons: cross-arm ABOVE the ropes; each rope threads a guide gate, so gondolas pass through cleanly
    for (const t of [0.34, 0.67]) { const p = cableAt(t), gy = ground(p.x, p.z), L = [], rope = p.y - gy, armY = rope + 1.5;
      cyl(L, 0.6, armY + 0.2, 0, (armY + 0.2) / 2, 0, "#b9b6ac", 8); cyl(L, 0.95, 0.5, 0, 0.25, 0, "#9a9488", 8);
      box(L, 0.6, 0.5, 8.8, 0, armY, 0, "#1b2420", ARM_RY);
      for (const o of [-LINE, LINE]) { for (const sl of [-0.7, 0.7]) { const q = o + sl, px = nx * q, pz = nz * q; box(L, 0.24, 1.75, 0.24, px, rope + 0.55, pz, "#1b2420", ARM_RY); box(L, 0.5, 0.3, 0.5, px, rope - 0.4, pz, "#3d4a46", ARM_RY); }
        box(L, 0.9, 0.18, 1.7, nx * o, armY - 0.34, nz * o, "#3d4a46", ARM_RY); }
      addMesh(L, p.x, gy, p.z); } }
  { const mkSt = (v, ry) => { const L = [], gy = ground(v.x, v.z); box(L, 7, 0.6, 5, 0, 0.3, 0, "#9a6b3c"); box(L, 4, 3, 3.4, 0, 2.1, 0, "#eadcb9"); roof(L, 3.8, 2, 0, 4.6, 0, "#c4442a"); box(L, 0.4, v.y - gy, 0.4, -2.6, (v.y - gy) / 2, 0, "#b9b6ac"); box(L, 0.5, 0.4, 8.6, -2.6, v.y - gy + 0.1, 0, "#1b2420", ARM_RY - ry); addMesh(L, v.x, gy, v.z).rotation.y = ry; };
    mkSt(V3(-34, CA.y, 6), STN_RY); // west station; the east station is the viewing deck below
    const L = [], gy = ground(DECK.x, DECK.z), WOOD = "#9a6b3c", DARK = "#6f4a2a", LAMP = "#ffd86a";
    // timber deck with plank edging and steps
    box(L, 14, 0.6, 11, 0, 0.3, 0, WOOD); box(L, 14.4, 0.22, 11.4, 0, 0.5, 0, DARK);
    for (let i = -6; i <= 6; i += 2) box(L, 0.06, 0.04, 11, i, 0.62, 0, "#b27a44");
    box(L, 4, 0.3, 1.2, 0, 0.15, 6.3, "#b0aa9c"); box(L, 4, 0.3, 0.7, 0, 0.45, 5.9, "#9a9488");
    // the summit station: same timber-frame style as the lodge, with the lime sign
    hall(L, 3.6, -2.2, 0, { len: 6.4, span: 4.6, wallH: 2.8, roofH: 2.2, win: 2, doorX: 0.6, chimney: false, ov: 0.8, wall: "#ecdcb8" });
    L.push({ g: new THREE.BoxGeometry(2.6, 0.55, 0.12), m: M4(3.6 + 0.6, 4.3, 0.2 + 0.08), c: "#c6f04e" });
    // sunset stage on the west side: raised floor, back wall, arch and warm lights
    box(L, 5, 0.5, 3, -1.6, 0.85, 3.2, DARK); box(L, 5.2, 0.12, 3.2, -1.6, 1.16, 3.2, "#c98a50");
    for (const s of [-1, 1]) { box(L, 0.3, 4.6, 0.3, -1.6 + s * 2.5, 3.4, 2.1, "#5e3f24"); box(L, 0.2, 1.4, 0.2, -1.6 + s * 2.5, 0.8, 4.8, DARK); }
    box(L, 5.6, 0.4, 0.4, -1.6, 5.8, 2.1, "#5e3f24"); box(L, 5, 3.4, 0.16, -1.6, 3.0, 1.75, "#2f7f6f"); box(L, 3.6, 0.7, 0.18, -1.6, 4.1, 1.62, "#c6f04e");
    for (let i = -2; i <= 2; i++) { L.push({ g: new THREE.IcosahedronGeometry(0.2, 0), m: M4(-1.6 + i * 1.05, 5.45, 2.35, 1, 1, 1), c: LAMP }); }
    // fence, lantern posts and benches
    for (let i = -6.5; i <= 6.5; i += 1.625) { if (Math.abs(i) > 2.1) box(L, 0.2, 1.2, 0.2, i, 1.2, 5.3, "#6f4a2a"); box(L, 0.2, 1.2, 0.2, i, 1.2, -5.3, "#6f4a2a"); }
    box(L, 14, 0.14, 0.14, 0, 1.75, -5.3, DARK); box(L, 14, 0.1, 0.1, 0, 1.3, -5.3, DARK); box(L, 4.8, 0.14, 0.14, 4.6, 1.75, 5.3, DARK); box(L, 4.8, 0.1, 0.1, 4.6, 1.3, 5.3, DARK); box(L, 4.4, 0.14, 0.14, -4.4, 1.75, 5.3, DARK); box(L, 4.4, 0.1, 0.1, -4.4, 1.3, 5.3, DARK);
    for (const px of [-6.5, 6.5]) for (const pz of [-5.3, 5.3]) { box(L, 0.22, 2.2, 0.22, px, 1.7, pz, "#5e3f24"); L.push({ g: new THREE.IcosahedronGeometry(0.26, 1), m: M4(px, 3.0, pz, 1, 1, 1), c: LAMP }); }
    for (const bx of [2.2, 5.4]) { box(L, 2, 0.12, 0.6, bx, 1.0, 4.3, "#c98a50"); box(L, 0.12, 0.5, 0.5, bx - 0.8, 0.8, 4.3, DARK); box(L, 0.12, 0.5, 0.5, bx + 0.8, 0.8, 4.3, DARK); }
    // cable pylon at the deck's west edge carrying both lines, flag on its own pole
    cyl(L, 0.5, 14, -6.2, 7, 0, "#b9b6ac"); box(L, 0.5, 0.4, 8.6, -6.2, 14, 0, "#1b2420", ARM_RY); box(L, 0.16, 0.16, 3.2, -6.2, 13.6, 0, "#5e3f24", 0);
    cyl(L, 0.1, 5, 6.4, 3.4, 4.6, "#7a5230", 6); L.push({ g: new THREE.ConeGeometry(0.9, 1.6, 3), m: M4(7.3, 5.4, 4.6, 1, 1, 0.1, 0, -Math.PI / 2), c: "#c6f04e" });
    addMesh(L, DECK.x, gy, DECK.z); }

  function makeCabin() {
    const L = [], GL = [], INK = "#12201b", CREAM = "#eadcb9", LIME = "#c6f04e", RED = "#c4442a", WOODC = "#8a5e34", STEEL = "#9aa3a0";
    // Grip clamped on the rope; the rotating sheaves are mounted in Gondola.jsx.
    box(L, 1.1, 0.5, 0.62, 0, 0, 0, INK);
    for (const s of [-1, 1]) box(L, .15, .2, .35, s * .62, .17, 0, STEEL);
    box(L, 1.7, 0.14, 0.2, 0, 0.3, 0, "#3d4a46");
    // one solid stem from the grip down to the roof, braced to the roof beam by two struts that meet it exactly
    box(L, 0.34, 2.45, 0.34, 0, -1.5, 0, INK);
    L.push({ g: new THREE.BoxGeometry(0.2, 1.95, 0.2), m: M4(-0.75, -2.0, 0, 1, 1, 1, 0, -0.9), c: INK }, { g: new THREE.BoxGeometry(0.2, 1.95, 0.2), m: M4(0.75, -2.0, 0, 1, 1, 1, 0, 0.9), c: INK });
    box(L, 3.2, 0.24, 0.34, 0, -2.62, 0, INK);
    // roof: red slab, lime top, shallow pyramid
    box(L, 4.2, 0.2, 3.2, 0, -2.9, 0, RED); box(L, 3.8, 0.18, 2.8, 0, -2.72, 0, LIME); roof(L, 2.5, 0.5, 0, -2.5, 0, LIME, 1.28, 1.0);
    // cabin frame: lime header, dark sill, corner and mid posts. Everything between is glass.
    box(L, 3.6, 0.4, 2.7, 0, -3.28, 0, LIME); box(L, 3.6, 0.5, 2.7, 0, -5.0, 0, CREAM); box(L, 3.7, 0.3, 2.8, 0, -5.4, 0, INK); box(L, 3.76, 0.12, 2.86, 0, -5.2, 0, LIME);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(L, 0.2, 1.7, 0.2, sx * 1.72, -4.18, sz * 1.27, INK);
    for (const sz of [-1, 1]) for (const px of [-0.57, 0.57]) box(L, 0.12, 1.7, 0.12, px, -4.18, sz * 1.29, INK);
    for (const sx of [-1, 1]) box(L, 0.12, 1.7, 0.12, sx * 1.74, -4.18, 0, INK);
    box(L, 3.3, 0.1, 2.4, 0, -4.98, 0, "#3d4a46"); // floor
    for (const sz of [-1, 1]) GL.push({ g: new THREE.BoxGeometry(3.3, 1.65, 0.05), m: M4(0, -4.18, sz * 1.25), c: "#9fdcec" });
    for (const sx of [-1, 1]) GL.push({ g: new THREE.BoxGeometry(0.05, 1.65, 2.4), m: M4(sx * 1.7, -4.18, 0), c: "#9fdcec" });
    // inside: a bench and two passengers
    box(L, 2.5, 0.22, 0.7, 0, -4.78, 0, WOODC); box(L, 2.5, 0.8, 0.12, 0, -4.4, -0.42, WOODC);
    for (const [px, c, hc] of [[-0.6, "#ff8d6a", "#f2c9a0"], [0.55, "#5ec2ff", "#e0b088"]]) { box(L, 0.5, 0.6, 0.4, px, -4.4, 0.05, c); L.push({ g: new THREE.IcosahedronGeometry(0.24, 1), m: M4(px, -3.9, 0.05), c: hc }); }
    const g = new THREE.Group(); const body = shadowed(new THREE.Mesh(merge(L), litMat)); addOutline(body, 0.05); g.add(body);
    const glass = new THREE.Mesh(merge(GL), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.34, depthWrite: false, fog: true })); glass.renderOrder = 3; g.add(glass); return g;
  }
  const cabinA = makeCabin(), cabinB = makeCabin(); scene.add(cabinA, cabinB);
  const cabinDir = CB.clone().sub(CA).normalize(), cabinYaw = Math.atan2(-cabinDir.z, cabinDir.x);
  function placeCabin(g, u, time, ph, o = 0) { const p = cableAt(u, o); g.position.copy(p); g.rotation.set(0, cabinYaw, Math.sin(time * 0.9 + ph) * 0.03); }

  await boot(86, "Painting the sky");
  // ---- far mountains + low-poly clouds + birds -----------------------------
  { const L = [], rr = mulberry(77);
    for (let i = 0; i < 16; i++) { const x = -190 + i * 25 + rr() * 12, z = -160 - rr() * 70, r = 24 + rr() * 22, h = 55 + rr() * 50; const g = new THREE.ConeGeometry(r, h, 5, 2); const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) + (rr() - 0.5) * 6, p.getY(k) + (p.getY(k) > -h / 2 + 1 ? (rr() - 0.5) * 8 : 0), p.getZ(k) + (rr() - 0.5) * 6);
      L.push({ g, m: M4(x, h / 2 - 8, z), c: ["#a29c88", "#b5ac94", "#948f80"][i % 3] }); }
    const m = new THREE.Mesh(merge(L), toonMat({ vertexColors: true, flatShading: true })); scene.add(m); }
  const clouds = []; { const cg = new THREE.IcosahedronGeometry(1, 1), cm = toonMat({ color: 0xf7e8cd, flatShading: true, emissive: 0x3a3020 });
    for (let i = 0; i < 9; i++) { const g = new THREE.Group(); const n = 4 + Math.floor(rand() * 3); for (let k = 0; k < n; k++) { const b = new THREE.Mesh(cg, cm); const s = 5 + rand() * 6; b.scale.set(s * 1.6, s * 0.65, s); b.position.set((k - n / 2) * 7 + rand() * 3, rand() * 2, rand() * 4); g.add(b); }
      g.position.set(-130 + i * 32 + rand() * 10, 62 + rand() * 18, -90 - rand() * 90); clouds.push(g); scene.add(g); } }
  const birds = []; { const bm = new THREE.MeshBasicMaterial({ color: 0x2b2a26, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, -1.2, 0.2, 0.4, -0.2, 0, 0.1, 0, 0, 0, 1.2, 0.2, 0.4, 0.2, 0, 0.1], 3)); const b = new THREE.Mesh(g, bm); b.userData = { r: 24 + rand() * 20, s: 0.15 + rand() * 0.12, p: rand() * 6.28, y: 30 + rand() * 12, cx: rand() * 30 - 15, cz: -34 + rand() * 20 }; birds.push(b); scene.add(b); } }


  // ---- camera path: one keyframe per chapter (index = CH index) -------------
  const KEYS = [
    { pos: [8, 17, 46], tgt: [-2, 11, -16] },    // 0 arrive: the whole valley
    { pos: [15, 13, 13], tgt: [0, 13, -34] },    // 1 the falls
    { pos: [-12, 17, 14], tgt: [2, 12, -12] },   // 2 cable car (target follows the cabin)
    { pos: [-4, 12, 12], tgt: [-10, 6, -8] },    // 3 base camp / lodge
    { pos: [-2, 10, 38], tgt: [-18, 5, 20] },    // 4 track totems
    { pos: [2, 19, 24], tgt: [22, 3, -10] },     // 5 water park
    { pos: [6, 9, 12], tgt: [-12, 6, -6] },      // 6 bridge
    { pos: [20, 31, -22], tgt: [24, 22, -46] },  // 7 summit deck
    { pos: [4, 32, 60], tgt: [0, 8, -22] },      // 8 register: high and wide
  ];
  const LAST = KEYS.length - 1;
  const curves = { pos: new THREE.CatmullRomCurve3(KEYS.map((k) => V3(...k.pos))), tgt: new THREE.CatmullRomCurve3(KEYS.map((k) => V3(...k.tgt))) };
  let cabU = 0.5; // gondola A: position on the line depends on time only (never on scroll), so it can never speed up or jump
  const cabinU = (stage, time) => 0.5 + 0.38 * Math.sin(time * 0.12);
  const _d = CB.clone().sub(CA).setY(0).normalize(), chaseOff = V3(-_d.z, 0, _d.x).multiplyScalar(19).addScaledVector(_d, -5); chaseOff.y = 4.5; // camera rides beside the line, on the open side
  const tmpC = V3(0, 0, 0);
  function pose(stage, portrait, time = 0) {
    stage = clamp(stage, 0, LAST); const t = stage / LAST;
    const pos = curves.pos.getPoint(t), tgt = curves.tgt.getPoint(t);
    const w = sm(1.3, 1.9, stage) * (1 - sm(2.75, 3.0, stage));
    if (w > 0.001) { const C = cableAt(cabU, -3.2); tmpC.copy(C); tmpC.y -= 2.8; tgt.lerp(tmpC, w); pos.lerp(C.add(chaseOff), w); } // the camera chases the gondola wherever it is
    if (portrait) pos.sub(tgt).multiplyScalar(1.3).add(tgt);
    return { pos, tgt, fov: portrait ? 58 : 45 };
  }

  // ---- track totems (the "Tracks" chapter) ----------------------------------
  const PLAZA = { x: -18, z: 20 };
  const TOT = TRACKS.map((t, i) => { const u = [-1, -1 / 3, 1 / 3, 1][i], x = PLAZA.x + u * 9, z = PLAZA.z + 2.2 * u * u; return { x, z, y: ground(x, z), col: t.col }; });
  const totems = TOT.map((t, i) => {
    const L = []; box(L, 3.2, 0.7, 3.2, 0, 0.1, 0, "#a39d90"); box(L, 1.2, 3.6, 1.2, 0, 2.5, 0, "#6b4a2b"); box(L, 1.6, 0.5, 1.6, 0, 3.9, 0, t.col); box(L, 1.8, 0.3, 1.8, 0, 4.45, 0, "#a39d90");
    for (const s of [-1, 1]) box(L, 0.2, 1.6, 0.2, 0.9 * s, 1.5, 0.9, "#5a3d24");
    const g = new THREE.Group(), base = addMesh(L, 0, 0, 0, true, 0.06); scene.add(g); scene.remove(base); g.add(base); g.position.set(t.x, t.y, t.z);
    // the emblem on top says what the track is about; it floats, spins and grows when picked
    const E = [], rotors = [], crystal = new THREE.Group(); crystal.position.y = 6.2;
    const ic = (r, x, y, z, c, d = 1, sx = 1, sy = 1, sz = 1) => E.push({ g: new THREE.IcosahedronGeometry(r, d), m: M4(x, y, z, sx, sy, sz), c });
    const cone = (r, h, seg, x, y, z, c) => E.push({ g: new THREE.ConeGeometry(r, h, seg), m: M4(x, y, z), c });
    if (i === 0) { // SKY: a survey drone with a camera pod and spinning rotors
      box(E, 1.1, 0.34, 1.1, 0, 0, 0, "#2b3a44"); box(E, 0.8, 0.12, 0.8, 0, 0.22, 0, t.col); ic(0.3, 0, -0.3, 0.2, "#1b2420"); ic(0.14, 0, -0.34, 0.42, "#8fd0e0");
      for (const a of [Math.PI / 4, -Math.PI / 4]) E.push({ g: new THREE.BoxGeometry(2.9, 0.1, 0.16), m: M4(0, 0.05, 0, 1, 1, 1, a), c: "#3d4a46" });
      for (const [px, pz] of [[1.02, 1.02], [-1.02, 1.02], [1.02, -1.02], [-1.02, -1.02]]) { E.push({ g: new THREE.CylinderGeometry(0.2, 0.2, 0.26, 8), m: M4(px, 0.1, pz), c: "#1b2420" }); rotors.push([px, pz]); }
      for (const s of [-1, 1]) box(E, 0.08, 0.4, 0.08, 0.4 * s, -0.4, -0.25, "#3d4a46");
    } else if (i === 1) { // CANOPY: a round-crowned tree and a little bird
      E.push({ g: new THREE.CylinderGeometry(0.16, 0.26, 1.2, 7), m: M4(0, -0.5, 0), c: "#6b4a2b" }); ic(0.85, 0, 0.55, 0, "#3fae5f", 1); ic(0.55, 0.62, 0.2, 0.2, "#4bd17a"); ic(0.5, -0.6, 0.25, -0.2, "#35a057"); ic(0.4, 0.1, 1.15, 0.2, "#6fe08e");
      ic(0.16, 1.15, 1.1, 0, "#ff9a3c", 0, 1.5, 1, 1); E.push({ g: new THREE.ConeGeometry(0.07, 0.3, 4), m: M4(1.4, 1.1, 0, 1, 1, 1, 0, -Math.PI / 2), c: "#ffd24a" });
    } else if (i === 2) { // RIVER: a water drop riding two ripple rings
      ic(0.78, 0, -0.1, 0, t.col, 2); cone(0.66, 1.3, 14, 0, 0.95, 0, t.col); ic(0.2, -0.28, 0.1, 0.5, "#e8fbff", 1, 0.6, 1.2, 0.6);
      for (const [r, y, c] of [[1.25, -0.85, "#e8fbff"], [1.75, -1.0, "#9be8ee"]]) E.push({ g: new THREE.TorusGeometry(r, 0.11, 6, 22), m: M4(0, y, 0, 1, 1, 1, 0, 0, Math.PI / 2), c });
    } else { // SUMMIT: two snowy peaks with a lime flag
      cone(1.25, 2.2, 6, 0, 0.1, 0, "#7f8d98"); cone(0.55, 0.9, 6, 0, 0.88, 0, "#ffffff"); cone(0.85, 1.4, 6, 1.05, -0.3, 0.35, "#95a2ad"); cone(0.4, 0.6, 6, 1.05, 0.18, 0.35, "#ffffff");
      E.push({ g: new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), m: M4(0, 1.95, 0), c: "#5e3f24" }); box(E, 0.7, 0.4, 0.06, 0.38, 2.3, 0, "#c6f04e");
    }
    const emb = shadowed(new THREE.Mesh(merge(E), litMat)); addOutline(emb, 0.06); crystal.add(emb);
    const rotorMeshes = rotors.map(([px, pz]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.18), toonMat({ color: 0xdfe8ec })); r.position.set(px, 0.3, pz); crystal.add(r); return r; });
    g.add(crystal);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 44, 12, 1, true), new THREE.MeshBasicMaterial({ color: t.col, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    beam.position.y = 26; beam.visible = false; g.add(beam);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 11, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 5.5; hit.userData.k = i; g.add(hit);
    return { g, crystal, beam, hit, rotorMeshes, k: i, s: 1 };
  });
  Game.onSquad.push(() => { /* highlight handled per frame */ });

  // ---- in-world captions (MiSide style) -------------------------------------
  const PX = coarse ? { black: 104, semi: 54 } : { black: 150, semi: 76 }, WGT = { black: 800, semi: 600 }, CAP_MID = 0.35;
  const WARM = "#fffaf0", CREAM = "#fbf5e7", LIME = "#c6f04e", PALE = "#dcf58a";
  const eyebrow = { font: "semi", ls: 0.16, c0: WARM, c1: CREAM, unit: "word", outline: 0.14 };
  const label = { font: "semi", ls: 0.2, c0: "#e3fb8f", c1: LIME, unit: "word", outline: 0.14 };
  const body = { font: "semi", ls: 0, c0: WARM, c1: CREAM, unit: "word", outline: 0.12 };
  const head = { font: "black", ls: -0.02, c0: WARM, c1: PALE, unit: "char", outline: 0.075 };
  const T0 = [0.03, 0.2, 0.03], T1 = [0.03, -0.2, -0.03];
  // landscape block + portrait block per beat: portrait always sits at the top, so the HUD pill at the bottom stays clear
  const place = (P, st, d, land, port, tilt = T0) => ({ stage: st, d, tilt, ...(P ? { nx: -0.88, ny: 0.7, anchor: "top", maxW: 0.88, ...port } : { nx: -0.88, ny: 0.1, anchor: "center", maxW: 0.42, ...land }) });
  const getSpecs = (P) => ({
    hero: { ...place(P, 0, 15, { ny: 0.08, size: 0.14, maxW: 0.5 }, { size: 0.07 }), lines: [
      { ...eyebrow, t: "ATHIRAPPILLY, KERALA  ·  15–16 JAN 2027", rel: 0.24, gap: 0.06, delay: 0 },
      { ...head, t: "HacknSky", rel: 1, lh: 1.0, gap: 0.1, delay: 0.15 },
      { ...eyebrow, t: "LESS ORDINARY. MORE ALTITUDE.", rel: 0.18, unit: "char", ls: 0.2, delay: 0.75 }] },
    dest: { ...place(P, 1.0, 11, { size: 0.085, maxW: 0.4 }, { size: 0.055 }), lines: [
      { ...label, t: "01 — THE FALLS", rel: 0.26, gap: 0.1, delay: 0 },
      { ...head, t: "Where the forest", rel: 1, lh: 1.0, delay: 0.12 }, { ...head, t: "breaks open.", rel: 1, lh: 1.0, gap: 0.14, delay: 0.5 },
      { ...body, t: "About 24 m of Chalakudy River.", rel: 0.3, lh: 1.3, delay: 0.95 }] },
    "cable-a": { stage: 2.0, follow: true, nx: -0.88, ny: P ? 0.7 : -0.9, anchor: P ? "top" : "bottom", size: P ? 0.055 : 0.074, maxW: P ? 0.88 : 0.42, tilt: [0.03, 0.2, -0.03], lines: [
      { ...label, t: "02 — THE CABLE CAR", rel: 0.26, gap: 0.12, delay: 0 },
      { ...head, t: "The view you’re", rel: 1, lh: 1.0, delay: 0.12 }, { ...head, t: "building for.", rel: 1, lh: 1.0, delay: 0.5 }] },
    "cable-b": { stage: 2.0, follow: true, nx: -0.88, ny: P ? 0.7 : -0.9, anchor: P ? "top" : "bottom", size: P ? 0.055 : 0.074, maxW: P ? 0.88 : 0.42, tilt: [0.03, 0.2, -0.03], lines: [
      { ...label, t: "02 — ALONG THE LINE", rel: 0.26, gap: 0.14, delay: 0 },
      { ...head, t: "Finals pitched", rel: 1, lh: 1.0, delay: 0.14 }, { ...head, t: "at sunset.", rel: 1, lh: 1.0, gap: 0.16, delay: 0.5 },
      { ...label, t: "RIDE PROPOSED  ·  SUBJECT TO CONFIRMATION", rel: 0.15, ls: 0.1, delay: 0.95 }] },
    exp: { ...place(P, 3, 12, { nx: 0.12, size: 0.075, maxW: 0.38 }, { size: 0.055 }, T1), lines: [
      { ...label, t: "03 — BASE CAMP", rel: 0.26, gap: 0.1, delay: 0 },
      { ...head, t: "Build by day.", rel: 1, lh: 1.0, delay: 0.12 }, { ...head, t: "Campfire by night.", rel: 1, lh: 1.0, gap: 0.16, delay: 0.5 },
      { ...label, t: "2 DAYS  ·  20 TEAMS  ·  2 PER TEAM", rel: 0.17, ls: 0.14, delay: 1.0 }] },
    trk: { ...place(P, 4, 12, { ny: -0.88, anchor: "bottom", size: 0.06, maxW: 0.4 }, { ny: 0.8, size: 0.045 }), lines: [
      { ...label, t: "04 — CHOOSE YOUR ALTITUDE", rel: 0.26, gap: 0.1, delay: 0 },
      { ...head, t: "Four totems.", rel: 1, lh: 1.0, delay: 0.12 }, { ...head, t: "One squad.", rel: 1, lh: 1.0, gap: 0.14, delay: 0.4 },
      { ...body, t: "Tap a totem to explore it.", rel: 0.3, lh: 1.3, delay: 0.85 }] },
    ...Object.fromEntries(TRACKS.map((t, i) => ["tot" + i, { stage: 4, at: () => V3(TOT[i].x, TOT[i].y + 8.6, TOT[i].z), anchor: "center", size: P ? 0.036 : 0.04, maxW: P ? 0.2 : 0.1, tilt: [0, 0, 0], lines: [
      { ...head, t: t.k.toUpperCase(), rel: 1, lh: 1.0, c0: "#ffffff", c1: t.col, delay: 0.3 + i * 0.18 },
      { ...label, t: "TAP TO OPEN", rel: 0.24, ls: 0.12, lh: 1.5, delay: 0.6 + i * 0.18 }] }])),
    play: { ...place(P, 5, 12, { size: 0.075 }, { size: 0.055 }), lines: [
      { ...label, t: "05 — THE PLAYGROUND", rel: 0.26, gap: 0.1, delay: 0 },
      { ...head, t: "Reset your head", rel: 1, lh: 1.0, delay: 0.12 }, { ...head, t: "between commits.", rel: 1, lh: 1.0, gap: 0.14, delay: 0.5 },
      { ...body, t: "Wave pool. Twin slides. Lazy river.", rel: 0.3, lh: 1.3, delay: 0.95 }] },
    route: { ...place(P, 6, 12, { size: 0.08 }, { size: 0.055 }), lines: [
      { ...label, t: "06 — THE ROUTE", rel: 0.26, gap: 0.1, delay: 0 },
      { ...head, t: "Four stops.", rel: 1, lh: 1.0, delay: 0.12 }, { ...head, t: "One valley.", rel: 1, lh: 1.0, gap: 0.14, delay: 0.4 },
      { ...body, t: "Campus  ·  Open call  ·  The sprint  ·  The finale", rel: 0.28, lh: 1.3, delay: 0.85 }] },
    awards: { ...place(P, 7, 14, { size: 0.08 }, { size: 0.055 }), lines: [
      { ...label, t: "07 — THE SUMMIT DECK", rel: 0.26, gap: 0.1, delay: 0 },
      { ...head, t: "Five finalists.", rel: 1, lh: 1.0, delay: 0.12 }, { ...head, t: "One sunset stage.", rel: 1, lh: 1.0, gap: 0.14, delay: 0.5 },
      { ...body, t: "Awards are still being planned.", rel: 0.3, lh: 1.3, delay: 0.95 }] },
    reg: { ...place(P, 8, 16, { size: 0.09, maxW: 0.46 }, { size: 0.05, nx: -0.76, ny: 0.6, maxW: 0.74 }, P ? [0, 0, 0] : T0), lines: [
      { ...label, t: "08 — YOUR CABIN", rel: 0.26, gap: 0.1, delay: 0 },
      { ...head, t: "Ready to", rel: 1, lh: 1.0, delay: 0.12 }, { ...head, t: "ascend?", rel: 1, lh: 1.0, gap: 0.14, delay: 0.4 },
      { ...body, t: "Register interest. No commitment yet.", rel: 0.3, lh: 1.3, delay: 0.85 }] },
  });
  const caps = {}; // beat id -> "out" | "in" | "gone"
  const OCCLUDE = true, ENTER = 0.8, EXIT = 0.42, QGEO = new THREE.PlaneGeometry(1, 1);
  const easeBack = (x) => { const c1 = 1.70158, c3 = c1 + 1, y = x - 1; return 1 + c3 * y * y * y + c1 * y * y; };
  const hsh = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const mixHex = (a, b, t) => "#" + C(a).lerp(C(b), clamp(t, 0, 1)).getHexString();
  const fontOf = (k, fam) => `${WGT[k]} ${PX[k]}px ${fam}`;

  function measureLine(ctx, l, fam) {
    const px = PX[l.font], ls = (l.ls || 0) * px; ctx.font = fontOf(l.font, fam);
    const adv = (n) => ctx.measureText(l.t.slice(0, n)).width + n * ls, spans = [];
    if (l.unit === "char") { for (let i = 0; i < l.t.length; i++) if (l.t[i] !== " ") spans.push([i, i + 1]); }
    else { let i = 0; while (i < l.t.length) { if (l.t[i] === " ") { i++; continue; } let j = i; while (j < l.t.length && l.t[j] !== " ") j++; spans.push([i, j]); i = j; } }
    return { emW: (adv(l.t.length) - ls) / px, units: spans.map(([a, b]) => ({ t: l.t.slice(a, b), x0: adv(a) / px, w: (adv(b) - ls - adv(a)) / px })) };
  }
  function drawUnit(cv, u, l, fam, kind, fills) {
    const px = PX[l.font], pd = Math.ceil(px * 0.3), w = Math.max(4, Math.ceil(u.w * px) + pd * 2), h = Math.ceil(px * 1.7); cv.width = w; cv.height = h;
    const x = cv.getContext("2d"); x.font = fontOf(l.font, fam); x.textBaseline = "alphabetic"; x.lineJoin = "round"; x.miterLimit = 2;
    const by = Math.round(h * 0.7), ls = (l.ls || 0) * px;
    const run = (fn) => { if (!ls) { fn(u.t, pd); return; } let cx = pd; for (const ch of u.t) { fn(ch, cx); cx += x.measureText(ch).width + ls; } };
    if (kind === "back") { x.fillStyle = x.strokeStyle = "#04150f"; x.lineWidth = px * l.outline * 2; run((s, cx) => x.strokeText(s, cx, by)); run((s, cx) => x.fillText(s, cx, by)); return { cw: w, ch: h, by }; }
    x.strokeStyle = "#0b2b24"; x.lineWidth = px * l.outline * 2; x.shadowColor = "rgba(4,21,15,.55)"; x.shadowBlur = px * 0.1; x.shadowOffsetY = px * 0.05;
    run((s, cx) => x.strokeText(s, cx, by)); x.shadowColor = "transparent"; x.shadowBlur = 0; x.shadowOffsetY = 0;
    const g = x.createLinearGradient(0, by - px * 0.78, 0, by + px * 0.06); g.addColorStop(0, fills[0]); g.addColorStop(1, fills[1]); x.fillStyle = g;
    run((s, cx) => x.fillText(s, cx, by)); return { cw: w, ch: h, by };
  }
  const mkTex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; try { renderer.initTexture(t); } catch (e) { /* uploaded on first use instead */ } return t; };

  // where a caption block sits relative to its camera pose
  function frameOf(spec, P, asp) {
    const p = pose(spec.stage, P), fwd = p.tgt.clone().sub(p.pos).normalize(), right = V3(0, 0, 0).crossVectors(fwd, V3(0, 1, 0)).normalize(), up = V3(0, 0, 0).crossVectors(right, fwd).normalize();
    const pt = spec.at ? spec.at() : null, depth = spec.follow ? p.pos.distanceTo(p.tgt) : pt ? p.pos.distanceTo(pt) : spec.d;
    const halfH = depth * Math.tan(THREE.MathUtils.degToRad(p.fov / 2)); return { p, fwd, right, up, pt, depth, halfH, halfW: halfH * asp };
  }
  const FOCUS = [[1, V3(0, 12, -34)], [3, V3(LODGE.x, ground(LODGE.x, LODGE.z) + 3, LODGE.z)], [5, V3(POOL.x, ground(POOL.x, POOL.z) + 3, POOL.z)], [6, V3(riverX(BRIDGE_Z), ground(riverX(BRIDGE_Z), BRIDGE_Z) + 1, BRIDGE_Z)], [7, V3(DECK.x, ground(DECK.x, DECK.z) + 3, DECK.z)]];
  // trees between the lens and a caption would hide letters: thin them out along every sight-line (both orientations)
  function clearForText() {
    const tubes = [];
    for (const P of [false, true]) for (const spec of Object.values(getSpecs(P))) {
      if (spec.follow) continue; const f = frameOf(spec, P, P ? 0.5 : Math.max(aspect, 1.6));
      const b = f.pt ? f.pt.clone() : f.p.pos.clone().addScaledVector(f.fwd, f.depth).addScaledVector(f.right, spec.nx * f.halfW).addScaledVector(f.up, spec.ny * f.halfH + (spec.anchor === "top" ? -0.2 : spec.anchor === "bottom" ? 0.2 : 0) * f.halfH);
      tubes.push({ a: f.p.pos.clone(), b, r0: 2, r1: f.pt ? 5 : 8 });
    }
    for (const P of [false, true]) { // the lens must never sit inside a canopy, and each landmark needs a clear view
      for (let s = 0; s <= LAST + 0.01; s += 0.5) { const q = pose(s, P); tubes.push({ a: q.pos.clone(), b: q.tgt.clone(), r0: 5.5, r1: 3 }); }
      for (const [k, pt] of FOCUS) tubes.push({ a: pose(k, P).pos.clone(), b: pt, r0: 6, r1: 9 });
    }
    clearTrees(tubes);
  }

  const textRoot = new THREE.Group(); scene.add(textRoot);
  let captions = {}, fam = null, portrait = false, aspect = 1;
  let specsNow = {}, mctx = null;
  function buildCaptions() { // texture work is lazy: only the captions near the current chapter exist at any time
    textRoot.clear(); captions = {}; capQ.length = 0; if (!fam) return;
    mctx = document.createElement("canvas").getContext("2d"); specsNow = getSpecs(portrait); ensureCaptions(Math.max(curCh, 0)); clearForText();
  }
  const capQ = []; // after the loader, captions are built one per frame so a chapter change never stalls the phone
  function ensureCaptions(ch) { for (const [id, spec] of Object.entries(specsNow)) if (!captions[id] && Math.abs(Math.floor(spec.stage) - ch) <= 1) { if (!Game.started) buildOne(id, spec); else if (!capQ.includes(id)) capQ.push(id); } }
  function buildOne(id, spec) {
    {
      const { p, fwd, right, up, pt, depth, halfH, halfW } = frameOf(spec, portrait, aspect), base = spec.size * 2 * halfH;
      const meas = spec.lines.map((l) => measureLine(mctx, l, fam));
      let widest = 0; spec.lines.forEach((l, i) => (widest = Math.max(widest, meas[i].emW * base * l.rel)));
      const fit = Math.min(1, (spec.maxW * 2 * halfW) / Math.max(widest, 1e-6)), title = base * fit; let cur = 0;
      const rows = spec.lines.map((l) => { const size = title * l.rel, lh = (l.lh || 1.25) * size, r = { size, y: -(cur + lh / 2) }; cur += lh + (l.gap || 0) * title; return r; });
      const shift = spec.anchor === "bottom" ? cur : spec.anchor === "center" ? cur / 2 : 0;
      const anchor = new THREE.Group(), tilt = new THREE.Group(); tilt.rotation.set(...spec.tilt); anchor.add(tilt); textRoot.add(anchor);
      const cap = { id, spec, anchor, lines: [], follow: spec.follow ? { dx: spec.nx * halfW, dy: spec.ny * halfH + shift } : null, bill: !!pt };
      if (pt) { anchor.position.copy(pt); tilt.position.y = shift; }
      else if (!cap.follow) { anchor.position.copy(p.pos).addScaledVector(fwd, depth).addScaledVector(right, spec.nx * halfW).addScaledVector(up, spec.ny * halfH + shift);
        anchor.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, fwd.clone().negate())); }
      spec.lines.forEach((l, li) => {
        const lg = new THREE.Group(); lg.position.y = rows[li].y; lg.visible = false; tilt.add(lg); const size = rows[li].size, k = size / PX[l.font], n = meas[li].units.length, units = [];
        meas[li].units.forEach((u, i) => {
          const fills = [mixHex(l.c0, l.c1, (n > 1 ? i / (n - 1) : 0) * 0.6), l.c1], cf = document.createElement("canvas"), cb = document.createElement("canvas");
          const d = drawUnit(cf, u, l, fam, "front", fills); drawUnit(cb, u, l, fam, "back", fills);
          const g = new THREE.Group(); g.position.x = (u.x0 + u.w / 2) * size - (cap.bill ? meas[li].emW * size / 2 : 0); g.visible = false; lg.add(g);
          const mat = (map) => new THREE.MeshBasicMaterial({ map: mkTex(map), transparent: true, opacity: 0, depthWrite: false, depthTest: OCCLUDE && !spec.follow, fog: false, toneMapped: false });
          const yOff = -CAP_MID * size + (d.by - d.ch / 2) * k;
          const back = new THREE.Mesh(QGEO, mat(cb)), front = new THREE.Mesh(QGEO, mat(cf));
          for (const m of [back, front]) { m.scale.set(d.cw * k, d.ch * k, 1); m.frustumCulled = false; }
          back.position.set(size * 0.03, yOff - size * 0.035, -size * 0.06); front.position.set(0, yOff, 0); back.renderOrder = 19; front.renderOrder = 20; g.add(back, front);
          units.push({ g, front, back, p: 0, cx: g.position.x });
        });
        cap.lines.push({ lg, units, size, delay: l.delay, step: l.unit === "char" ? 0.05 : 0.1, vis: false, t: 0 });
      });
      captions[id] = cap;
    }
  }
  function animateCaptions(dt, time) {
    for (const cap of Object.values(captions)) {
      const vis = caps[cap.id] === "in";
      if (cap.follow) { // ride along with the gondola the camera is tracking
        const c = cableAt(cabU, -3.2); c.y -= 2.8; const r = V3(1, 0, 0).applyQuaternion(camera.quaternion), u = V3(0, 1, 0).applyQuaternion(camera.quaternion);
        cap.anchor.position.copy(c).addScaledVector(r, cap.follow.dx).addScaledVector(u, cap.follow.dy); cap.anchor.quaternion.copy(camera.quaternion); }
      else if (cap.bill) cap.anchor.quaternion.copy(camera.quaternion);
      for (const ln of cap.lines) {
        if (vis && !ln.vis) ln.t = 0; ln.vis = vis; if (vis) ln.t += dt; let any = false;
        ln.units.forEach((u, i) => {
          if (reduced) u.p = vis ? 1 : 0; else if (vis) { if (ln.t > ln.delay + i * ln.step) u.p = Math.min(1, u.p + dt / ENTER); } else u.p = Math.max(0, u.p - dt / EXIT);
          const p = u.p; u.g.visible = p > 0.002; if (p <= 0.002) return; any = true;
          const r1 = hsh(i, 1) - 0.5, r2 = hsh(i, 2), r3 = hsh(i, 3) - 0.5, s = ln.size; let ox, oy, oz, rz, sc;
          if (vis || reduced) { const e = easeBack(p), inv = 1 - e; ox = r1 * s * 1.6 * inv; oy = -s * (0.9 + r2 * 0.9) * inv; oz = r3 * s * 1.2 * inv; rz = r3 * 1.6 * inv; sc = Math.max(0.001, e); }
          else { const inv = 1 - sm(0, 1, p); ox = r1 * s * 1.2 * inv; oy = s * (0.8 + r2 * 0.8) * inv; oz = -s * 3 * inv; rz = r3 * 1.2 * inv; sc = 0.55 + 0.45 * p; }
          const settle = reduced ? 0 : sm(0.7, 1, p); oy += Math.sin(time * 1.5 + i * 0.7) * s * 0.035 * settle; rz += Math.sin(time * 1.1 + i * 1.3) * 0.03 * settle;
          u.g.position.set(u.cx + ox, oy, oz); u.g.rotation.z = rz; u.g.scale.setScalar(sc);
          const o = sm(0, 1, p * 1.7); u.front.material.opacity = o; u.back.material.opacity = o * 0.95;
        });
        ln.lg.visible = any;
      }
    }
  }

  // ---- totem focus: tap a totem -> camera glides in and a floating 3D detail card opens beside it ----
  let focus = -1, fk = 0, fz = 0, hoverK = -1;
  const hitMeshes = totems.map((x) => x.hit), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const trkbar = $("#tcard"), pickBtn = $("#pick"), backBtn = $("#back");
  const syncPick = () => { pickBtn.innerHTML = Game.squad === fk ? "Squad locked ✓" : "Pick " + TRACKS[fk].k + ' <span aria-hidden="true">→</span>'; };
  function openFocus(k) { focus = fk = k; const tr = TRACKS[k], q = (s) => trkbar.querySelector(s); trkbar.style.setProperty("--c", tr.col); q(".tc-pill").textContent = "Track 0" + (k + 1); q(".tc-name").textContent = tr.k; q(".tc-tag").textContent = tr.tag; q(".tc-ask").textContent = tr.ask;
    q(".tc-ico").innerHTML = tr.ico; q(".tc-ideas").innerHTML = tr.ideas.map((s) => "<li>" + s + "</li>").join(""); q(".tc-body").scrollTop = 0; syncPick(); trkbar.classList.add("on"); document.body.style.cursor = ""; }
  function closeFocus() { if (focus < 0) return; focus = -1; trkbar.classList.remove("on"); }
  function pickTotem(e) { if (curCh !== 4 || !Game.started || Game.sheetOpen) return -1; ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); camera.updateMatrixWorld(); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(hitMeshes, false); return h.length ? h[0].object.userData.k : -1; }
  addEventListener("click", (e) => { if (e.target.closest("button,a,header,#sheet,#tcard,input,select")) return; const k = pickTotem(e); if (k >= 0 && k !== focus) openFocus(k); else if (focus >= 0) closeFocus(); });
  addEventListener("pointermove", (e) => { if (e.pointerType === "touch") return; const k = focus < 0 ? pickTotem(e) : -1; if (k !== hoverK) { hoverK = k; document.body.style.cursor = k >= 0 ? "pointer" : ""; } }, { passive: true });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeFocus(); });
  backBtn.onclick = closeFocus; pickBtn.onclick = () => { if (Game.squad !== fk) { setSquad(fk); syncPick(); setTimeout(closeFocus, 900); } else closeFocus(); };
  Game.onSquad.push(() => { if (focus >= 0) syncPick(); });

  // ---- scroll -> stage, beats, HUD ---------------------------------------------
  const chEls = CH.map((c) => document.getElementById(c.id));
  const secTop = (el) => el.getBoundingClientRect().top + scrollY;
  const links = $$("#links a"), railBtns = $$("#rail button"), hud = $("#hud"), brief = $("#brief"), objt = $("#objt"), cn = $("#cn");
  let T = [], Hh = [], stage = 0, smooth = 0, vh = innerHeight, heroReady = false, curCh = -1;
  const measure = () => { vh = innerHeight; T = chEls.map(secTop); Hh = chEls.map((e) => Math.max(1, e.offsetHeight)); };
  const chapterAt = (sy, off = 0.5) => { let i = 0; for (let k = 0; k < T.length; k++) if (T[k] <= sy + off) i = k; return i; };
  function stageAt(sy) {
    const i = chapterAt(sy); if (i >= LAST) return LAST; const u = clamp((sy - T[i]) / Hh[i], 0, 1), c = CH[i];
    return i + (c.lin ? u : sm(c.d ?? 0.5, 1, u));
  }
  const beat = (id, ch, a, b, sy) => { const u = (sy - T[ch]) / Hh[ch]; caps[id] = u < a ? "out" : u < b ? "in" : "gone"; };
  function updateBeats(sy) {
    caps.hero = !heroReady ? "out" : sy < vh * 0.16 ? "in" : "gone";
    beat("dest", 1, -0.15, 0.5, sy); beat("cable-a", 2, -0.05, 0.46, sy); beat("cable-b", 2, 0.5, 0.85, sy); beat("exp", 3, -0.15, 0.5, sy);
    for (const id of ["trk", "tot0", "tot1", "tot2", "tot3"]) beat(id, 4, -0.15, 0.55, sy);
    beat("play", 5, -0.15, 0.5, sy); beat("route", 6, -0.15, 0.5, sy); beat("awards", 7, -0.15, 0.5, sy); beat("reg", 8, -0.3, 9, sy);
    if (focus >= 0) { for (const id of ["trk", "tot0", "tot1", "tot2", "tot3"]) caps[id] = "out"; if (chapterAt(sy, vh * 0.35) !== 4) closeFocus(); }
    const hudOn = Game.started && sy > vh * 0.16; hud.classList.toggle("on", hudOn); document.body.classList.toggle("scrolled", sy > vh * 0.16);
    const cur = chapterAt(sy, vh * 0.35), c = CH[cur];
    if (cur !== curCh) {
      curCh = cur; ensureCaptions(cur); objt.textContent = c.obj; cn.textContent = pad(cur + 1);
      railBtns.forEach((b, i) => b.classList.toggle("on", i === cur)); links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + c.id));
      if (c.sheet) { brief.dataset.sheet = c.sheet; brief.className = cur === LAST ? "btn" : "btn btn-ghost"; brief.innerHTML = cur === LAST ? 'Register interest <span aria-hidden="true">→</span>' : 'Briefing <span aria-hidden="true">+</span>'; }
    }
    const u = (sy - T[cur]) / Hh[cur]; brief.classList.toggle("on", hudOn && focus < 0 && !!c.sheet && (cur === 2 || cur === LAST || u < 0.62));
  }

  // ---- resize --------------------------------------------------------------
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener("pointermove", (e) => { pointer.x = (e.clientX / innerWidth - 0.5) * 2; pointer.y = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  let capKey = "";
  let rW = 0, rH = 0;
  function resize() {
    const w = innerWidth, h = innerHeight; if (rW && w === rW && Math.abs(h - rH) < rH * 0.22) return; rW = w; rH = h; renderer.setSize(w, h, false); portrait = w / h < 0.9; aspect = Math.round((w / h) * 20) / 20 || 1;
    camera.aspect = w / h; camera.fov = portrait ? 58 : 45; camera.updateProjectionMatrix(); measure();
    const key = portrait + "|" + aspect; if (fam && key !== capKey) { capKey = key; buildCaptions(); }
  }
  let rzT; addEventListener("resize", () => { clearTimeout(rzT); rzT = setTimeout(resize, 120); });
  addEventListener("load", measure);
  new ResizeObserver(measure).observe(document.body);
  Game.onStart = () => { measure(); setTimeout(() => (heroReady = true), reduced ? 100 : 1700); };
  let intro0 = null;

  // wait for the page font, then build every caption texture once
  await boot(92, "Lettering the world");
  const famCss = getComputedStyle(document.body).fontFamily, first = famCss.split(",")[0].trim();
  await Promise.race([Promise.all([document.fonts.load(`800 100px ${first}`), document.fonts.load(`600 100px ${first}`)]), new Promise((r) => setTimeout(r, 3000))]).catch(() => {});
  fam = famCss; resize();
  if (!capKey) { capKey = portrait + "|" + aspect; try { buildCaptions(); } catch (e) { showError("3D captions failed: " + e.message); } }
  await boot(95, "Detailing the landmarks");
  const motion = { time: 0, stage: 0, cablePosition: .5, quality: coarse ? 1 : 0, reduced, coarse };
  const landmarks = await mountValleyDetails({
    canvas, renderer, scene, camera, motion, cabins: [cabinA, cabinB],
    falls: { curtain, ground, riverX, waterY, fallZ: FALL_Z, gradientMap: gradMap },
  });
  let contextLost = false;
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    landmarks.dispose();
    failWorld("The 3D scene lost its graphics connection. You can still read the plain page.");
  }, { once: true });
  await boot(97, "Compiling shaders");
  try { camera.position.set(8, 17, 46); camera.lookAt(-2, 11, -16); if (renderer.compileAsync && renderer.extensions.has("KHR_parallel_shader_compile")) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera); renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera); } catch (e) { showError("Render warm-up failed: " + e.message); }
  await boot(100, "World ready");

  // ---- render loop -----------------------------------------------------------
  const clock = new THREE.Clock();
  let shadowTick = 0, dprMax = renderer.getPixelRatio(), dprNow = dprMax, accT = 0, accN = 0, qual = 0, slowW = 0, warmW = 0, halfRate = false, skipF = false, pendDt = 0, perfT = 0, perfN = 0;
  const dprFloor = Math.min(dprMax, coarse ? 1.25 : 0.8), setPR = (v) => { dprNow = Math.max(dprFloor, v); renderer.setPixelRatio(dprNow); renderer.setSize(innerWidth, innerHeight, false); };
  let lowGfx = false; try { lowGfx = localStorage.getItem("hns-gfx") === "low"; } catch (e) { /* ignore */ }
  function setQual(n) {
    motion.quality = n;
    if (n >= 1) for (const s of treeSets) s.om.visible = false;                                  // forests lose their ink outline (halves their draw cost)
    if (n >= 2) for (const s of treeSets) { const c = Math.floor(s.list.length * 0.7); s.im.count = c; s.om.count = c; } // thin the forest
    if (n >= 3) { fireflies.visible = false; for (const d of decor) d.visible = false; for (const o of outlines) o.visible = false; } // transparent overdraw and ground clutter go next
    if (n >= 4) { for (const s of treeSets) { const c = Math.floor(s.list.length * 0.45); s.im.count = c; s.om.count = c; } setPR(dprNow - 0.2); } // pixels last, and never below the floor
    if (n >= 5) halfRate = true;
  }
  function frame() {
    if (contextLost || ROOT.classList.contains("nogl")) return;
    requestAnimationFrame(frame); if (document.hidden) { clock.getDelta(); return; }
    const raw = clock.getDelta(); if (halfRate) { skipF = !skipF; if (skipF) { pendDt += raw; return; } } // weakest tier: render every other frame, a steady 30 beats a stuttery 60
    const dt = Math.min(raw + pendDt, 0.1), time = clock.elapsedTime; pendDt = 0;
    if (!Game.started || Game.sheetOpen) { accT = accN = 0; return; } // nothing on screen to update
    perfT += dt; perfN++; if (perfN === 600) track("perf", { avgMs: Math.round((perfT / perfN) * 1000 * 10) / 10, qual, dpr: Math.round(dprNow * 100) / 100, coarse, lowGfx, trees: treeSets.length });
    accT += dt; accN++; // quality ladder: if frames run long, drop effects first (forest outlines, then tree count) and pixels last
    if (accN >= 30) { const avg = accT / accN; accT = accN = 0;
      if (++warmW > 2) { slowW = avg > 0.024 ? slowW + 1 : 0; if (slowW >= 1 && qual < 5) { qual++; slowW = 0; setQual(qual); track("quality_tier", { n: qual, avgMs: Math.round(avg * 1000) }); } } }
    const sy = scrollY; updateBeats(sy);
    const target = stageAt(sy); smooth = reduced ? target : smooth + (target - smooth) * (1 - Math.exp(-dt * 5.5)); stage = smooth; cabU = reduced ? .42 : cabinU(stage, time);
    const p = pose(stage, portrait, time);
    if (intro0 === null) intro0 = time; // opening swoop: drop in from high above onto the hero view
    const it = reduced ? 1 : clamp((time - intro0) / 3.6, 0, 1), lift = Math.pow(1 - it, 3) * (1 - sm(0, 0.5, stage));
    if (lift > 0.001) { p.pos.y += lift * 42; p.pos.z += lift * 34; p.tgt.y -= lift * 6; }
    fz += ((focus >= 0 ? 1 : 0) - fz) * (1 - Math.exp(-dt * 4.5));
    if (fz > 0.002) { // glide in on the tapped totem; the card floats to its right (above it on phones)
      const tt = TOT[fk], C = V3(tt.x, tt.y + 5, tt.z), fw = p.tgt.clone().sub(p.pos).normalize(), rt = V3(0, 0, 0).crossVectors(fw, V3(0, 1, 0)).normalize(), dh = V3(p.pos.x - C.x, 0, p.pos.z - C.z).normalize(), e = sm(0, 1, fz);
      const fp = portrait ? C.clone().addScaledVector(dh, 15).add(V3(0, 3.5, 0)) : C.clone().addScaledVector(dh, 11).add(V3(0, 2.5, 0)), ft = portrait ? V3(C.x, C.y - 2.6, C.z) : C.clone().addScaledVector(rt, 4.2);
      p.pos.lerp(fp, e); p.tgt.lerp(ft, e); }
    pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3)); pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
    const par = reduced || coarse ? 0 : 1; p.pos.x += pointer.sx * 1.6 * par; p.pos.y -= pointer.sy * 0.8 * par;
    const floor = ground(p.pos.x, p.pos.z) + 2.5; if (p.pos.y < floor) p.pos.y = floor; // never dip into the terrain
    camera.position.copy(p.pos); camera.lookAt(p.tgt);
    // cabins: A is the one the camera follows; B passes it going the other way
    const u = cabU; placeCabin(cabinA, u, reduced ? 0 : time, 0, -3.2); placeCabin(cabinB, 1 - u, reduced ? 0 : time, 2, 3.2);
    waterUniforms.time.value = reduced ? 0 : time;
    for (const t of totems) { const sel = Game.squad === t.k, up = sel ? 1.35 : (hoverK === t.k || focus === t.k) ? 1.2 : 1; t.s += (up - t.s) * (1 - Math.exp(-dt * 6)); t.crystal.scale.setScalar(t.s);
      if (!reduced) { t.crystal.rotation.y = time * (focus === t.k ? 3 : 1.2) + t.k; t.crystal.position.y = 6.2 + Math.sin(time * 1.6 + t.k) * 0.25; for (const r of t.rotorMeshes) r.rotation.y = time * 40; }
      t.beam.visible = sel; if (sel) t.beam.material.opacity = 0.2 + 0.07 * Math.sin(time * 3); }
    if (!reduced) {
      for (let i = 0; i < MIST_N; i++) { const b = mistBase[i], k = (time * 0.12 * b.s + b.p) % 1; mistPos[i * 3] = b.x + Math.sin(time * 0.4 + b.p) * 1.5; mistPos[i * 3 + 1] = b.y + k * 7; mistPos[i * 3 + 2] = b.z + Math.cos(time * 0.3 + b.p) * 1.5; }
      mistGeo.attributes.position.needsUpdate = true;
      for (let i = 0; i < FF_N; i++) { const b = ffBase[i]; ffPos[i * 3] = b.x + Math.sin(time * 0.3 + b.p) * 2; ffPos[i * 3 + 1] = b.y + Math.sin(time * 0.7 + b.p * 2) * 0.8; ffPos[i * 3 + 2] = b.z + Math.cos(time * 0.25 + b.p) * 2; }
      ffGeo.attributes.position.needsUpdate = true; fireflies.material.opacity = 0.55 + 0.35 * Math.sin(time * 1.3);
      clouds.forEach((c, i) => { c.position.x += dt * (0.5 + (i % 3) * 0.25); if (c.position.x > 170) c.position.x = -170; });
      birds.forEach((b) => { const d = b.userData, a = time * d.s + d.p; b.position.set(d.cx + Math.cos(a) * d.r, d.y + Math.sin(a * 2) * 1.5, d.cz + Math.sin(a) * d.r * 0.6); b.rotation.y = -a + Math.PI / 2; b.rotation.z = Math.sin(time * 6 + d.p) * 0.35; });
      fireLight.intensity = 12 + Math.sin(time * 9) * 2 + Math.sin(time * 23) * 1.2; fireMesh.scale.y = 1 + Math.sin(time * 11) * 0.12;
    }
    if (capQ.length) { const id = capQ.shift(); if (!captions[id] && specsNow[id]) buildOne(id, specsNow[id]); }
    animateCaptions(dt, time);
    renderer.shadowMap.needsUpdate = (shadowTick++ % 3) === 0; // cabins and crystals move slowly: a shadow refresh every 3rd frame is invisible
    motion.time = time;
    motion.stage = stage;
    motion.cablePosition = u;
    landmarks.render(time);
  }
  if (lowGfx || (coarse && ((navigator.deviceMemory || 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 4))) { qual = 5; setQual(5); } else if (coarse) { qual = 1; setQual(1); } // weak device or Low: everything off; any other phone starts without forest outlines
  const gfx = $("#gfx"); gfx.textContent = "Graphics: " + (lowGfx ? "Low" : "Auto"); gfx.onclick = () => { lowGfx = !lowGfx; try { localStorage.setItem("hns-gfx", lowGfx ? "low" : "auto"); } catch (e) { /* ignore */ } gfx.textContent = "Graphics: " + (lowGfx ? "Low" : "Auto"); if (lowGfx && qual < 5) { qual = 5; setQual(5); } else if (!lowGfx) showError("Auto graphics return next time the page loads."); };
  frame();
  await new Promise((r) => setTimeout(r, Math.max(0, 1900 - (performance.now() - bootT0)))); // let the loader play
  track("loaded", { ms: Math.round(performance.now() - bootT0), coarse, qual });
  if (!contextLost && !ROOT.classList.contains("nogl")) enter(false);
}
