"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "@/lib/noise";
import { timeUniform } from "@/lib/shaders";
import { facet, gradientMap } from "@/lib/toon";

const blobGeo = facet(new THREE.IcosahedronGeometry(1, 0));
const cloudMat = new THREE.MeshToonMaterial({
  color: "#ffffff",
  emissive: "#eaf4f7",
  emissiveIntensity: 0.35,
  gradientMap,
});

const SPAN = 240;

export default function Clouds({ count = 8, seed = 5, minY = 30, maxY = 50 }) {
  const refs = useRef([]);

  const clouds = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => {
      const blobs = Array.from({ length: 4 + Math.floor(rand() * 3) }, (_, i) => ({
        x: (i - 2) * (2.6 + rand()),
        y: (rand() - 0.5) * 1.2,
        z: (rand() - 0.5) * 2.4,
        sx: 3 + rand() * 2.4,
        sy: 1.5 + rand() * 1.1,
        sz: 2.4 + rand() * 1.6,
      }));
      return {
        x0: rand() * SPAN,
        y: minY + rand() * (maxY - minY),
        z: -75 + rand() * 85,
        speed: 0.5 + rand() * 1.1,
        scale: 1.1 + rand() * 1.2,
        blobs,
      };
    });
  }, [count, seed, minY, maxY]);

  useFrame(() => {
    const t = timeUniform.value;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const c = clouds[i];
      g.position.x = ((c.x0 + t * c.speed) % SPAN) - SPAN / 2;
      g.position.y = c.y + Math.sin(t * 0.25 + i) * 0.5;
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
          {c.blobs.map((b, j) => (
            <mesh
              key={j}
              geometry={blobGeo}
              material={cloudMat}
              position={[b.x, b.y, b.z]}
              scale={[b.sx, b.sy, b.sz]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
