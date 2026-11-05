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
  varying vec2 vUv;
  varying float vFall;
  #include <fog_pars_fragment>

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float speed = mix(0.8, 3.2, vFall);
    float scale = mix(0.7, 0.45, vFall);
    vec2 q = vec2(vUv.x * 5.0 + vUv.y * 0.15, vUv.y * scale - uTime * speed * 0.35);
    vec2 cell = floor(q);
    vec2 f = fract(q);
    // each cell is split into two triangles with their own shade
    float tri = step(f.x, f.y);
    float r = hash(cell + tri * 17.0);

    vec3 col = mix(uDeep, uShallow, 0.3 + 0.55 * hash(cell + tri * 5.0 + 3.0));
    float streak = step(0.74 - 0.2 * vFall, r);
    col = mix(col, uFoam, streak * 0.85);

    float edge = abs(vUv.x - 0.5) * 2.0;
    col = mix(col, uFoam, smoothstep(0.8, 1.0, edge) * 0.75);

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
    uDeep: { value: new THREE.Color("#2f8fb0") },
    uShallow: { value: new THREE.Color("#78c9e0") },
    uFoam: { value: new THREE.Color("#f4fbff") },
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
  varying vec3 vDir;
  void main() {
    float t = smoothstep(-0.05, 0.6, vDir.y);
    gl_FragColor = vec4(mix(uHorizon, uTop, t), 1.0);
    #include <colorspace_fragment>
  }
`;

export function createSkyMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color("#8ccbe6") },
      uHorizon: { value: new THREE.Color("#eef3e6") },
    },
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
}

export const FOG_COLOR = "#e4eee6";

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
