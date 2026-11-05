import * as THREE from "three";

// One shared clock for every animated material in the scene. FrameDriver
// advances it; with reduced motion it simply never moves.
export const timeUniform = { value: 0 };

const vertexShader = /* glsl */ `
  attribute float aFall;
  varying vec2 vUv;
  varying float vFall;
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vFall = aFall;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uFoam;
  uniform vec3 uSun;
  varying vec2 vUv;
  varying float vFall;
  #include <fog_pars_fragment>

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + 17.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float speed = mix(0.28, 1.55, vFall);
    vec2 flow = vec2(vUv.x * 4.6, vUv.y * 0.34 - uTime * speed);
    float body = fbm(flow * 1.35 + fbm(flow * 0.55) * 0.8);
    float streak = fbm(vec2(vUv.x * 17.0, vUv.y * 0.9 - uTime * speed * 1.7));

    vec3 col = mix(uDeep, uShallow, 0.3 + body * 0.55 + vFall * 0.12);
    // long soft foam bands down the current
    float bands = smoothstep(0.58, 0.8, body * 0.65 + streak * 0.55);
    col = mix(col, uFoam, bands * 0.62);

    // bright lace where the sheet leaves the cliff
    float crest = smoothstep(0.42, 0.7, vFall) * smoothstep(0.66, 0.86, streak);
    col = mix(col, uFoam, crest * 0.4);

    // thin darker banks and pale edge foam
    float edge = smoothstep(0.3, 0.5, abs(vUv.x - 0.5));
    col = mix(col, uDeep * 0.88, edge * 0.25);
    col = mix(col, uFoam, smoothstep(0.42, 0.5, abs(vUv.x - 0.5)) * 0.46);

    // warm glints from the low sun
    float glint = smoothstep(0.68, 0.84, body + streak * 0.35);
    col += uSun * glint * 0.2;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export function createFlowMaterial() {
  const uniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uTime: timeUniform, // shared object on purpose, so one clock drives all
    uDeep: { value: new THREE.Color("#236f7f") },
    uShallow: { value: new THREE.Color("#65b8c4") },
    uFoam: { value: new THREE.Color("#f6efdc") },
    uSun: { value: new THREE.Color("#ffd29a") },
  };
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    fog: true,
    side: THREE.DoubleSide,
  });
}

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  varying vec3 vDir;
  void main() {
    vec3 dir = normalize(vDir);
    float t = smoothstep(-0.05, 0.62, dir.y);
    vec3 col = mix(uHorizon, uTop, t);

    // a small hard sun with a warm, wide halo
    float d = max(dot(dir, normalize(uSunDir)), 0.0);
    float halo = pow(d, 14.0);
    float horizonGlow = pow(d, 4.0) * (1.0 - smoothstep(0.0, 0.45, dir.y));
    col = mix(col, uSunColor, halo * 0.2);
    col += uSunColor * horizonGlow * 0.07;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function createSkyMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color("#8ccbe6") },
      uHorizon: { value: new THREE.Color("#eef3e6") },
      uSunDir: { value: new THREE.Vector3(0.45, 0.3, -0.6).normalize() },
      uSunColor: { value: new THREE.Color("#ffe8b6") },
    },
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
}

const poolFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uFoam;
  uniform vec3 uSun;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    vec2 flow = vUv * 7.0 + vec2(uTime * 0.02, uTime * 0.03);
    float ripple = noise(flow) * 0.55 + noise(flow * 2.3) * 0.45;
    float rim = smoothstep(0.52, 1.0, r);
    vec3 col = mix(uShallow, uDeep, smoothstep(0.05, 0.9, r));
    col = mix(col, uFoam, rim * 0.22 + ripple * 0.08);
    float glint = smoothstep(0.64, 0.88, ripple) * (1.0 - rim);
    col += uSun * glint * 0.28;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function createWaterMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: timeUniform,
      uDeep: { value: new THREE.Color("#2f7f8f") },
      uShallow: { value: new THREE.Color("#7cc8cd") },
      uFoam: { value: new THREE.Color("#f6efdc") },
      uSun: { value: new THREE.Color("#ffd29a") },
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: poolFragment,
  });
}

export const FOG_COLOR = "#c7d2d0";

// One global rAF drives timeUniform for every canvas, so two scenes on the
// page never double the flow speed. Idempotent. Frozen under reduced motion.
let clockStarted = false;
export function startGlobalClock(scrollState) {
  if (clockStarted || typeof window === "undefined") return;
  clockStarted = true;
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!scrollState.reduced && !document.hidden) timeUniform.value += dt;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
