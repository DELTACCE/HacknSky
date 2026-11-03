import * as THREE from 'three';

/** Creates the WebGL renderer. Throws when WebGL is unavailable so callers can fall back. */
export function createRenderer(canvas, lowPower) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: innerWidth > 760,
    powerPreference: 'high-performance',
  });
  if (!renderer.getContext()) throw new Error('WebGL context unavailable');
  renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1.25 : 1.75));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}
