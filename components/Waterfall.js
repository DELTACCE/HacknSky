"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildRibbon, waterSample } from "@/lib/ribbon";
import { createFlowMaterial, timeUniform } from "@/lib/shaders";
import { FALL_CENTER, heightAt } from "@/lib/world";
import { Rock } from "./primitives";

const PUFFS = 9;
const puffGeo = new THREE.IcosahedronGeometry(1, 0);
const puffMat = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
});

// River + waterfall: one ribbon that follows the river line, hugs the
// terrain and turns into a fast white sheet where it crosses the cliff.
export default function Waterfall({ zBack = -62, zFront = 28, rows = 220 }) {
  const geometry = useMemo(
    () => buildRibbon({ zBack, zFront, rows }),
    [zBack, zFront, rows]
  );
  const material = useMemo(() => createFlowMaterial(), []);
  const puffs = useRef([]);

  const base = useMemo(() => {
    const s = waterSample(FALL_CENTER + 3.4);
    return { x: s.x, y: heightAt(s.x, FALL_CENTER + 3.6) + 1.1, z: s.z + 0.6 };
  }, []);

  const puffSeeds = useMemo(
    () =>
      Array.from({ length: PUFFS }, (_, i) => ({
        phase: i / PUFFS,
        dx: (Math.sin(i * 12.9898) * 2 - 0) * 1.4,
        dz: Math.cos(i * 78.233) * 1.2,
        size: 1.2 + ((i * 37) % 7) / 7,
      })),
    []
  );

  useFrame(() => {
    const t = timeUniform.value;
    puffs.current.forEach((m, i) => {
      if (!m) return;
      const s = puffSeeds[i];
      const life = (t * 0.22 + s.phase) % 1;
      const k = Math.sin(life * Math.PI);
      m.position.set(base.x + s.dx, base.y + life * 3.4, base.z + s.dz + life * 1.2);
      m.scale.setScalar(0.2 + k * s.size);
    });
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  return (
    <group>
      <mesh geometry={geometry} material={material} />

      {puffSeeds.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (puffs.current[i] = el)}
          geometry={puffGeo}
          material={puffMat}
        />
      ))}

      {/* boulders at the plunge pool */}
      <Rock position={[base.x - 3.4, base.y - 0.4, base.z + 1.2]} size={[1.5, 1.1, 1.3]} />
      <Rock position={[base.x + 3.2, base.y - 0.5, base.z + 0.4]} size={[1.2, 1.4, 1.1]} rotation={[0, 1, 0]} />
      <Rock position={[base.x + 1.2, base.y - 0.7, base.z + 3.2]} size={[0.9, 0.7, 0.9]} />
      <Rock position={[base.x - 1.6, base.y - 0.6, base.z + 3.6]} size={[0.8, 0.6, 1]} rotation={[0, 2, 0]} />
    </group>
  );
}
