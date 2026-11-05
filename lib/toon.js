import * as THREE from "three";

// Shared cel-shading kit. A tiny stepped gradient turns every lit material into
// flat bands, and inverted-hull outlines give the low-poly props an ink line.

export const INK = "#0f2016";
export const OUTLINE_COLOR = "#0f2016";

// Five hard steps from shadow to light. NearestFilter keeps the bands crisp.
const STEPS = new Uint8Array([52, 104, 158, 210, 255]);
export const gradientMap = new THREE.DataTexture(STEPS, STEPS.length, 1, THREE.RedFormat);
gradientMap.minFilter = THREE.NearestFilter;
gradientMap.magFilter = THREE.NearestFilter;
gradientMap.generateMipmaps = false;
gradientMap.needsUpdate = true;

export const outlineMaterial = new THREE.MeshBasicMaterial({
  color: OUTLINE_COLOR,
  side: THREE.BackSide,
  fog: true,
});

// One material per colour + extras, shared by both canvases.
const cache = new Map();
export function toon(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!cache.has(key)) {
    cache.set(
      key,
      new THREE.MeshToonMaterial({
        color,
        gradientMap,
        ...extra,
      })
    );
  }
  return cache.get(key);
}

export function toonVertexColors(extra = {}) {
  const key = "vertex" + JSON.stringify(extra);
  if (!cache.has(key)) {
    cache.set(
      key,
      new THREE.MeshToonMaterial({
        vertexColors: true,
        gradientMap,
        ...extra,
      })
    );
  }
  return cache.get(key);
}

// Low-poly faces need hard normals. MeshToonMaterial has no flatShading flag,
// so split the geometry and rebuild per-face normals instead.
export function facet(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.computeVertexNormals();
  return g;
}

export const outlineScale = (size, k = 0.06) => [
  size[0] * (1 + k),
  size[1] * (1 + k),
  size[2] * (1 + k),
];
