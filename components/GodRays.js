"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { timeUniform } from "@/lib/shaders";

const RAYS = [
  { pos: [25, 34, -22], scale: [10, 48, 10], rot: [0.1, 0.2, -0.32], opacity: 0.055 },
  { pos: [12, 30, -38], scale: [8, 44, 8], rot: [0.05, 0.7, -0.2], opacity: 0.042 },
  { pos: [37, 28, -4], scale: [6, 38, 6], rot: [0.16, 1.2, -0.42], opacity: 0.04 },
];

// Cheap volumetric shafts: three additive cones, no render-target cost.
export default function GodRays() {
  const refs = useRef([]);
  useFrame(() => {
    const t = timeUniform.value;
    refs.current.forEach((m, i) => {
      if (m) m.material.opacity = RAYS[i].opacity * (0.75 + 0.25 * Math.sin(t * 0.18 + i));
    });
  });
  return (
    <group>
      {RAYS.map((r, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={r.pos}
          rotation={r.rot}
          scale={r.scale}
          renderOrder={2}
        >
          <coneGeometry args={[1, 1, 7, 1, true]} />
          <meshBasicMaterial
            color="#ffe0a6"
            transparent
            opacity={r.opacity}
            depthWrite={false}
            side={2}
            blending={2}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}
