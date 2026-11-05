"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mulberry32 } from "@/lib/noise";
import { timeUniform } from "@/lib/shaders";
import { facet, gradientMap } from "@/lib/toon";

const SPAN = 300;
const WHITE = new THREE.Color("#ffffff");
const SHADE = new THREE.Color("#b4d2d9");

const cloudMaterial = new THREE.MeshToonMaterial({
  vertexColors: true,
  gradientMap,
  emissive: "#e8f5f8",
  emissiveIntensity: 0.16,
});
const cloudOutline = new THREE.MeshBasicMaterial({
  color: "#7fa3aa",
  side: THREE.BackSide,
  transparent: true,
  opacity: 0.8,
});

// Merge each cloud's puffs into one geometry so a whole cloud is a single
// fill plus a single silhouette line, not a pile of separate polygons.
function buildCloud(blobs) {
  const parts = blobs.map((b) => {
    const g = new THREE.IcosahedronGeometry(1, 1);
    g.scale(b.sx, b.sy, b.sz);
    g.translate(b.x, b.y, b.z);
    const color = b.top ? WHITE : SHADE;
    const count = g.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  });
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return facet(merged);
}

export default function Clouds({ count = 10, seed = 5, minY = 24, maxY = 52 }) {
  const refs = useRef([]);

  const clouds = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => {
      const puffs = 7 + Math.floor(rand() * 4);
      const blobs = Array.from({ length: puffs }, (_, i) => {
        const x = (i - puffs / 2) * (1.7 + rand() * 1.5);
        const y = (rand() - 0.1) * 1.7 + Math.sin((i / puffs) * Math.PI) * 1.3;
        return {
          x,
          y,
          z: (rand() - 0.5) * 2.4,
          sx: 2.7 + rand() * 2.3,
          sy: 1.7 + rand() * 1.2,
          sz: 2.4 + rand() * 1.8,
          top: y > 0.5,
        };
      });
      blobs.push({ x: 0, y: 1.5, z: -0.2, sx: 3.1, sy: 2.4, sz: 2.9, top: true });
      blobs.push({ x: 0, y: -0.85, z: 0, sx: 4.3 + rand() * 1.8, sy: 1.2, sz: 3.1 + rand() * 1.2, top: false });
      return {
        x0: rand() * SPAN,
        y: minY + rand() * (maxY - minY),
        z: -100 + rand() * 92,
        speed: 0.28 + rand() * 0.8,
        scale: 0.75 + rand() * 0.9,
        rot: (rand() - 0.5) * 0.25,
        geometry: buildCloud(blobs),
      };
    });
  }, [count, seed, minY, maxY]);

  useEffect(
    () => () => {
      clouds.forEach((c) => c.geometry.dispose());
    },
    [clouds]
  );

  useFrame(() => {
    const t = timeUniform.value;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const c = clouds[i];
      g.position.x = ((c.x0 + t * c.speed) % SPAN) - SPAN / 2;
      g.position.y = c.y + Math.sin(t * 0.18 + i) * 0.7;
      g.rotation.y = c.rot;
    });
  });

  return (
    <group>
      {clouds.map((c, i) => (
        <group
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={[((c.x0) % SPAN) - SPAN / 2, c.y, c.z]}
          scale={c.scale}
        >
          <mesh geometry={c.geometry} material={cloudMaterial} />
          <mesh geometry={c.geometry} material={cloudOutline} scale={1.034} />
        </group>
      ))}
    </group>
  );
}
