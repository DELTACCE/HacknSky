"use client";

import * as THREE from "three";

// Tiny shared kit for hand-built low-poly props. Geometries and materials
// are cached module-wide (and intentionally never disposed): they are shared
// by every canvas on the page.

const matCache = new Map();
export function mat(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!matCache.has(key)) {
    matCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        flatShading: true,
        roughness: 1,
        metalness: 0,
        ...extra,
      })
    );
  }
  return matCache.get(key);
}

const geoCache = new Map();
function geo(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}

export const PALETTE = {
  paper: "#f6f2e8",
  emerald: "#0b3d2e",
  forest: "#1f5130",
  sage: "#8fa98a",
  sky: "#bfe3f2",
  water: "#69c4e2",
  lime: "#b8f04a",
  stone: "#7d8d7a",
  wood: "#a9815b",
  woodDark: "#8a6445",
  glass: "#7cc4de",
  ink: "#26332d",
};

// `size` scales a unit primitive: Box = [w, h, d] (centred),
// Cone / Cyl = [radiusX, height, radiusZ] (centred, radius 1 height 1).
export function Box({
  position = [0, 0, 0],
  size = [1, 1, 1],
  rotation = [0, 0, 0],
  color = PALETTE.paper,
  matProps,
  ...rest
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={size}
      geometry={geo("box", () => new THREE.BoxGeometry(1, 1, 1))}
      material={mat(color, matProps)}
      {...rest}
    />
  );
}

export function Cone({
  position = [0, 0, 0],
  size = [1, 1, 1],
  rotation = [0, 0, 0],
  radial = 4,
  color = PALETTE.forest,
  matProps,
  ...rest
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={size}
      geometry={geo(`cone${radial}`, () => {
        const g = new THREE.ConeGeometry(1, 1, radial, 1);
        // square roofs: put corners on the diagonals so they match boxes
        if (radial === 4) g.rotateY(Math.PI / 4);
        return g;
      })}
      material={mat(color, matProps)}
      {...rest}
    />
  );
}

export function Cyl({
  position = [0, 0, 0],
  size = [1, 1, 1],
  rotation = [0, 0, 0],
  radial = 8,
  color = PALETTE.paper,
  matProps,
  ...rest
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={size}
      geometry={geo(`cyl${radial}`, () => new THREE.CylinderGeometry(1, 1, 1, radial, 1))}
      material={mat(color, matProps)}
      {...rest}
    />
  );
}

export function Rock({ position, size = [1, 1, 1], rotation = [0, 0, 0], color = PALETTE.stone }) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={size}
      geometry={geo("rock", () => new THREE.DodecahedronGeometry(1, 0))}
      material={mat(color)}
    />
  );
}
