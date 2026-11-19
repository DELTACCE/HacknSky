import * as THREE from "three";

// Geometry, shaders and choreography adapted from the supplied hacknsky-intro-3d demo.
const W = 1600,
  H = 697,
  D = 2400;
const LETTERS = [
  { x: 0, y: 285, w: 325, h: 412 },
  { x: 9, y: 1, w: 242, h: 264 },
  { x: 254, y: 0, w: 217, h: 264 },
  { x: 337, y: 285, w: 390, h: 412 },
  { x: 471, y: 0, w: 161, h: 264 },
  { x: 647, y: 0, w: 212, h: 263 },
  { x: 706, y: 285, w: 346, h: 412 },
  { x: 856, y: 51, w: 194, h: 212 },
];
const P = { x: 956, y: 26, w: 644, h: 670 };
const G = { x: 102, y: 110, w: 342, h: 460, ox: 184, oy: 50, dx: -510, dy: -88 };
const B = { x: 445, y: 58, w: 72, h: 67 };
const WF = { x: 436.92887029288704, y: 616 };
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const L = (a, b, t) => a + (b - a) * t;
const eo = (t) => 1 - Math.pow(1 - t, 3);
const eb = (t) => 1 + 2.9 * Math.pow(t - 1, 3) + 1.9 * Math.pow(t - 1, 2);
const seg = (t, s, d) => cl((t - s) / d);
const rn = (i, k) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const VS =
  "varying vec2 vUv,vW;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xy;gl_Position=projectionMatrix*viewMatrix*w;}";
const FS =
  "uniform sampler2D map;uniform float uOp,uWipe,uShineX;uniform vec3 uTint;varying vec2 vUv,vW;void main(){vec4 c=texture2D(map,vUv);if(vUv.x>uWipe)discard;float s=smoothstep(0.,1.,1.-abs(vW.x+vW.y*.6-uShineX)/90.);gl_FragColor=vec4(c.rgb*uTint+s*.28*c.a,c.a*uOp);}";
const BVS =
  "uniform float uFlap;varying vec2 vUv,vW;void main(){vUv=uv;vec3 p=position;float k=abs(p.x)/36.;p.y+=k*k*uFlap*16.;p.z+=k*uFlap*10.;vec4 w=modelMatrix*vec4(p,1.);vW=w.xy;gl_Position=projectionMatrix*viewMatrix*w;}";
const WFS = `uniform sampler2D map;uniform float uT,uOp;varying vec2 vUv,vW;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
void main(){float m=texture2D(map,vUv).a;if(m<.02)discard;float s=n(vec2(vUv.x*70.,vUv.y*10.-uT*2.4))*.65+n(vec2(vUv.x*150.,vUv.y*24.-uT*4.))*.35;float k=smoothstep(.45,.85,s);
gl_FragColor=vec4(mix(vec3(.35,.78,.64),vec3(1.),k),m*uOp*(.25+.55*k));}`;

/** Owns one intro canvas, including all listeners, GPU resources and animation frames. */
export function createIntroScene(host, { onReady, onComplete, onFail }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 10, 12000);
  const textures = new Set();
  let disposed = false,
    failed = false,
    loaded = false,
    completed = false,
    raf = 0,
    elapsed = 0,
    last = 0;
  const fail = () => {
    if (disposed || failed) return;
    failed = true;
    cancelAnimationFrame(raf);
    onFail?.();
  };

  const stencil = {
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: THREE.EqualStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
  };
  const shine = { value: -9999 };
  const base = (o) => ({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    ...(o.st ? stencil : {}),
  });
  const material = (texture, o = {}) =>
    new THREE.ShaderMaterial({
      ...base(o),
      vertexShader: VS,
      fragmentShader: FS,
      uniforms: {
        map: { value: texture },
        uOp: o.op || { value: 1 },
        uWipe: o.wipe || { value: 1 },
        uTint: { value: new THREE.Color().setScalar(o.tint ?? 1) },
        uShineX: o.noShine ? { value: -9999 } : shine,
      },
    });
  const plane = (w, h, a = 1, b = 1) => new THREE.PlaneGeometry(w, h, a, b);
  const manager = new THREE.LoadingManager();
  manager.onError = fail;
  const loader = new THREE.TextureLoader(manager);
  const tex = {};
  const names = [
    ...LETTERS.map((_, i) => `l${i}`),
    "base",
    "panel_mask",
    "wf",
    "cable",
    "gondola",
    "bird",
  ];
  names.forEach((name) => {
    const texture = loader.load(`/assets/brand/${name}.png`, () => {
      if (disposed) texture.dispose();
    });
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    tex[name] = texture;
    textures.add(texture);
  });

  const letters = LETTERS.map((letter, i) => {
    const group = new THREE.Group(),
      opacity = { value: 0 },
      layers = 10;
    for (let k = layers; k >= 0; k--) {
      const mesh = new THREE.Mesh(
        plane(letter.w, letter.h),
        material(tex[`l${i}`], {
          op: opacity,
          tint: k ? L(0.62, 0.3, k / layers) : 1,
          noShine: !!k,
        }),
      );
      mesh.position.z = -k * 3.4;
      mesh.renderOrder = 10 + layers - k;
      group.add(mesh);
    }
    scene.add(group);
    return { group, opacity, letter };
  });

  const panel = new THREE.Group(),
    pop = { value: 0 };
  scene.add(panel);
  panel.add(
    new THREE.Mesh(
      plane(P.w, P.h),
      new THREE.MeshBasicMaterial({
        map: tex.panel_mask,
        alphaTest: 0.5,
        colorWrite: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        stencilWrite: true,
        stencilRef: 1,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilZPass: THREE.ReplaceStencilOp,
      }),
    ),
  );
  for (let k = 9; k > 0; k--) {
    const mesh = new THREE.Mesh(
      plane(P.w, P.h),
      material(tex.base, { op: pop, tint: L(0.5, 0.22, k / 9), noShine: true }),
    );
    mesh.position.z = -k * 3.4;
    mesh.renderOrder = 30 + 9 - k;
    panel.add(mesh);
  }
  const add = (mesh, z, order) => {
    mesh.position.z = z;
    mesh.renderOrder = order;
    panel.add(mesh);
  };
  add(new THREE.Mesh(plane(P.w, P.h), material(tex.base, { op: pop, st: true })), 0, 50);
  const waterfallMaterial = new THREE.ShaderMaterial({
    ...base({ st: true }),
    vertexShader: VS,
    fragmentShader: WFS,
    uniforms: { map: { value: tex.wf }, uT: { value: 0 }, uOp: { value: 0 } },
  });
  add(new THREE.Mesh(plane(P.w, P.h), waterfallMaterial), 2, 51);
  const cableWipe = { value: 0 };
  add(
    new THREE.Mesh(
      plane(P.w, P.h),
      material(tex.cable, { wipe: cableWipe, st: true, noShine: true }),
    ),
    6,
    52,
  );

  const gondola = new THREE.Group(),
    gondolaOpacity = { value: 0 },
    pivotX = G.x + G.ox,
    pivotY = G.y + G.oy;
  panel.add(gondola);
  for (let k = 7; k >= 0; k--) {
    const mesh = new THREE.Mesh(
      plane(G.w, G.h),
      material(tex.gondola, {
        op: gondolaOpacity,
        tint: k ? L(0.7, 0.35, k / 7) : 1,
        st: true,
        noShine: !!k,
      }),
    );
    mesh.position.set(G.x + G.w / 2 - pivotX, -(G.y + G.h / 2 - pivotY), 14 - k * 2.6);
    mesh.renderOrder = 53 + 7 - k;
    gondola.add(mesh);
  }

  const bird = new THREE.Group(),
    birdUniforms = {
      map: { value: tex.bird },
      uOp: { value: 0 },
      uWipe: { value: 1 },
      uTint: { value: new THREE.Color(1, 1, 1) },
      uShineX: { value: -9999 },
      uFlap: { value: 0 },
    };
  panel.add(bird);
  const birdMesh = new THREE.Mesh(
    plane(B.w, B.h, 16, 2),
    new THREE.ShaderMaterial({
      ...base({ st: true }),
      uniforms: birdUniforms,
      vertexShader: BVS,
      fragmentShader: FS,
    }),
  );
  birdMesh.renderOrder = 70;
  bird.add(birdMesh);

  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = dotCanvas.height = 64;
  const ctx = dotCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const dot = new THREE.CanvasTexture(dotCanvas);
  textures.add(dot);

  const cloud = (count, size, opacity) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size,
        map: dot,
        vertexColors: true,
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    );
    points.frustumCulled = false;
    points.renderOrder = 90;
    scene.add(points);
    return points;
  };
  const particleCount = 260,
    mistCount = 90;
  const pollen = cloud(particleCount, 12, 0.85),
    mist = cloud(mistCount, 46, 0.5);
  const palette = [
    [0.96, 0.75, 0.29],
    [0.84, 0.16, 0.43],
    [0.35, 0.75, 0.6],
    [0.95, 0.55, 0.12],
  ];
  for (let i = 0; i < particleCount; i++)
    pollen.geometry.attributes.color.array.set(palette[Math.floor(rn(i, 4) * 4)], i * 3);
  const mistOrigin = { x: P.x + WF.x - W / 2, y: H / 2 - (P.y + WF.y) };

  let pendulum = 0,
    angularVelocity = 0,
    previousX = null,
    previousVelocity = 0,
    pointerX = 0,
    pointerY = 0;
  const pointer = { x: 0, y: 0 };
  const update = (t, dt) => {
    letters.forEach(({ group, opacity, letter }, i) => {
      const u = seg(t, 0.2 + (i < 5 ? i * 0.11 : 0.35 + (i - 5) * 0.11), 1.5),
        s = 1 - eb(u),
        side = i % 2 ? 1 : -1,
        up = i < 5 ? 1 : -1;
      opacity.value = cl(u * 4);
      group.position.set(
        letter.x + letter.w / 2 - W / 2 + s * side * 520,
        H / 2 - letter.y - letter.h / 2 + s * up * 620,
        s * 1100,
      );
      group.rotation.set(s * up * 1.7, s * side * 2.4, s * side * 0.5);
    });
    const entrance = seg(t, 0.7, 1.5),
      eased = eo(entrance);
    pop.value = cl(entrance * 3);
    panel.position.set(
      P.x + P.w / 2 - W / 2 + (1 - eased) * 700,
      H / 2 - P.y - P.h / 2,
      (1 - eased) * -300,
    );
    panel.rotation.set(
      Math.cos(t * 0.5) * 0.03 * eased,
      (1 - eased) * -1.3 + Math.sin(t * 0.6) * 0.05 * eased,
      0,
    );
    cableWipe.value = eo(seg(t, 1.5, 0.9));
    waterfallMaterial.uniforms.uT.value = t;
    waterfallMaterial.uniforms.uOp.value = cl((t - 1.8) / 0.8);

    const arrival = eo(seg(t, 1.9, 2.1)),
      x = G.dx * (1 - arrival);
    gondolaOpacity.value = t > 1.8 ? 1 : 0;
    if (previousX === null) {
      previousX = x;
      previousVelocity = 0;
    }
    const velocity = (x - previousX) / dt,
      acceleration = cl((velocity - previousVelocity) / dt, -4000, 4000);
    previousX = x;
    previousVelocity = velocity;
    for (let i = 0; i < 2; i++) {
      const h = dt / 2;
      pendulum = cl(pendulum + angularVelocity * h, -0.5, 0.5);
      angularVelocity +=
        (-11 * pendulum -
          1.3 * angularVelocity -
          acceleration * 0.0011 +
          (t > 4 ? Math.sin(t * 1.4) * 0.12 : 0)) *
        h;
    }
    gondola.position.set(pivotX - P.w / 2 + x, P.h / 2 - pivotY - G.dy * (1 - arrival), 0);
    gondola.rotation.z = -pendulum;

    const flight = seg(t, 2.5, 2),
      easedFlight = eo(flight),
      p0 = [-(B.x + B.w + 60), 120],
      p1 = [-330, -90],
      q = 1 - easedFlight;
    const bx = q * q * p0[0] + 2 * q * easedFlight * p1[0],
      by = q * q * p0[1] + 2 * q * easedFlight * p1[1];
    const dx = 2 * q * (p1[0] - p0[0]) + 2 * easedFlight * -p1[0],
      dy = 2 * q * (p1[1] - p0[1]) + 2 * easedFlight * -p1[1];
    bird.position.set(B.x + B.w / 2 - P.w / 2 + bx, P.h / 2 - B.y - B.h / 2 - by, 40 + q * 60);
    bird.rotation.z = Math.atan2(-dy, dx) * 0.35 * (1 - flight);
    bird.scale.setScalar(L(0.7, 1, easedFlight));
    birdUniforms.uOp.value = t > 2.5 ? 1 : 0;
    birdUniforms.uFlap.value =
      t < 2.5
        ? 0
        : Math.sin(t * 22) * (1 - cl((t - 4.6) / 1.2)) +
          0.25 * Math.sin(t * 2.4) * cl((t - 4.6) / 1.2);
    const sweep = (t - 3.6) % 7;
    shine.value = t > 3.6 && sweep < 2.2 ? L(-1000, 1000, sweep / 2.2) : -9999;

    const pp = pollen.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pp[i * 3] = (rn(i, 1) - 0.5) * 1800 + Math.sin(t * 0.5 + i) * 18;
      pp[i * 3 + 1] = ((rn(i, 2) * 900 + t * (14 + rn(i, 5) * 18)) % 900) - 450;
      pp[i * 3 + 2] = (rn(i, 3) - 0.4) * 500;
    }
    pollen.geometry.attributes.position.needsUpdate = true;
    pollen.material.opacity = 0.85 * cl((t - 0.8) / 2);
    const mp = mist.geometry.attributes.position.array,
      mc = mist.geometry.attributes.color.array;
    for (let i = 0; i < mistCount; i++) {
      const life = (t * 0.28 + rn(i, 6)) % 1,
        fade = life * life;
      mp[i * 3] = mistOrigin.x + (rn(i, 7) - 0.5) * 100 + Math.sin(life * 7 + i) * 14;
      mp[i * 3 + 1] = mistOrigin.y + life * 140;
      mp[i * 3 + 2] = 22 + rn(i, 8) * 40;
      mc[i * 3] = L(0.95, 0.86, fade);
      mc[i * 3 + 1] = L(1, 0.94, fade);
      mc[i * 3 + 2] = L(0.98, 0.89, fade);
    }
    mist.geometry.attributes.position.needsUpdate =
      mist.geometry.attributes.color.needsUpdate = true;
    mist.material.opacity = 0.5 * cl((t - 2) / 1.5);
    pointer.x += (pointerX - pointer.x) * 0.05;
    pointer.y += (pointerY - pointer.y) * 0.05;
    const dolly = eo(seg(t, 0, 3.4));
    camera.position.set(
      Math.sin(t * 0.35) * 60 + pointer.x * 160,
      Math.cos(t * 0.3) * 30 - pointer.y * 90,
      D * L(1.45, 1, dolly),
    );
    camera.lookAt(0, 0, 0);
    camera.rotateZ((1 - dolly) * 0.12);
  };

  const fit = () => {
    if (disposed || failed) return;
    const width = Math.max(1, host.clientWidth),
      height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const logoWidth = Math.min(width * (width <= 600 ? 0.76 : 0.58), 960);
    const visibleHeight = Math.max((W / logoWidth) * height, H / 0.5);
    camera.fov = (2 * Math.atan(visibleHeight / 2 / D) * 180) / Math.PI;
    camera.updateProjectionMatrix();
    if (completed) renderer.render(scene, camera);
  };
  const frame = (ms) => {
    raf = 0;
    if (disposed || failed || document.hidden) return;
    const delta = Math.max(0, (ms - last) / 1000);
    const dt = cl(delta, 0.001, 0.05);
    last = ms;
    elapsed += delta;
    try {
      update(elapsed, dt);
      renderer.render(scene, camera);
    } catch {
      fail();
      return;
    }
    if (!completed && elapsed >= 6.6) {
      completed = true;
      onComplete?.();
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (disposed || failed || completed || !loaded || raf || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  manager.onLoad = () => {
    if (disposed || failed) return;
    loaded = true;
    fit();
    onReady?.();
    start();
  };
  const onPointer = (event) => {
    pointerX = event.clientX / innerWidth - 0.5;
    pointerY = event.clientY / innerHeight - 0.5;
  };
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  };
  const onContextLost = (event) => {
    event.preventDefault();
    fail();
  };
  const observer = new ResizeObserver(fit);
  observer.observe(host);
  if (matchMedia("(pointer: fine)").matches)
    addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (object.material) [].concat(object.material).forEach((m) => m.dispose());
      });
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
