"use client";

import * as THREE from "three";
import {
  facet,
  outlineMaterial,
  outlineScale,
  toon,
} from "@/lib/toon";

// Tiny shared kit for hand-built low-poly props. Geometries and materials
// are cached module-wide (and intentionally never disposed): they are shared
// by every canvas on the page.

export const mat = toon;

// Additive extras that make a hull bulge just enough to show its ink edge.
function Hull({ geometry, position, rotation, scale, visible = true }) {
  if (!visible) return null;
  return (
    <mesh
      geometry={geometry}
      material={outlineMaterial}
      position={position}
      rotation={rotation}
      scale={outlineScale(scale)}
    />
  );
}

function Parts({ geometry, material, position, rotation, scale, outline, ...rest }) {
  return (
    <>
      <mesh
        geometry={geometry}
        material={material}
        position={position}
        rotation={rotation}
        scale={scale}
        {...rest}
      />
      <Hull
        geometry={geometry}
        position={position}
        rotation={rotation}
        scale={scale}
        visible={outline}
      />
    </>
  );
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
  stone: "#a99b80",
  clay: "#d9754a",
  wood: "#a9815b",
  woodDark: "#8a6445",
  glass: "#7cc4de",
  glow: "#ffe9a6",
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
  outline = true,
  ...rest
}) {
  return (
    <Parts
      position={position}
      rotation={rotation}
      scale={size}
      geometry={geo("box", () => facet(new THREE.BoxGeometry(1, 1, 1)))}
      material={mat(color, matProps)}
      outline={outline}
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
  outline = true,
  ...rest
}) {
  return (
    <Parts
      position={position}
      rotation={rotation}
      scale={size}
      geometry={geo(`cone${radial}`, () => {
        const g = new THREE.ConeGeometry(1, 1, radial, 1);
        // square roofs: put corners on the diagonals so they match boxes
        if (radial === 4) g.rotateY(Math.PI / 4);
        return facet(g);
      })}
      material={mat(color, matProps)}
      outline={outline}
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
  outline = true,
  ...rest
}) {
  return (
    <Parts
      position={position}
      rotation={rotation}
      scale={size}
      geometry={geo(`cyl${radial}`, () =>
        facet(new THREE.CylinderGeometry(1, 1, 1, radial, 1))
      )}
      material={mat(color, matProps)}
      outline={outline}
      {...rest}
    />
  );
}

export function Rock({
  position,
  size = [1, 1, 1],
  rotation = [0, 0, 0],
  color = PALETTE.stone,
  outline = true,
}) {
  return (
    <Parts
      position={position}
      rotation={rotation}
      scale={size}
      geometry={geo("rock", () => facet(new THREE.DodecahedronGeometry(1, 0)))}
      material={mat(color)}
      outline={outline}
    />
  );
}
