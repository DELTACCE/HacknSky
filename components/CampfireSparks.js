"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { softDiscTexture } from "@/lib/sprites";
import { timeUniform } from "@/lib/shaders";
import { mulberry32 } from "@/lib/noise";
import { PADS, heightAt } from "@/lib/world";

const COUNT = 18;

export default function CampfireSparks() {
  const ref = useRef();
  const tex = useMemo(() => softDiscTexture(), []);
  const venue = PADS.find((p) => p.id === "venue");
  const origin = useMemo(
    () => [venue.x + 3.6, heightAt(venue.x, venue.z) + 0.9, venue.z + 2.9],
    [venue]
  );
  const seeds = useMemo(() => {
    const rand = mulberry32(19);
    return Array.from({ length: COUNT }, () => ({
      phase: rand(),
      speed: 0.25 + rand() * 0.35,
      dx: (rand() - 0.5) * 0.55,
      dz: (rand() - 0.5) * 0.55,
      wobble: rand() * 5,
    }));
  }, []);

  const positions = useMemo(() => new Float32Array(COUNT * 3), []);

  useFrame(() => {
    if (!ref.current) return;
    const t = timeUniform.value;
    const pos = ref.current.geometry.attributes.position;
    seeds.forEach((s, i) => {
      const life = (t * s.speed + s.phase) % 1;
      pos.array[i * 3] = origin[0] + s.dx + Math.sin(t * 2 + s.wobble) * 0.18;
      pos.array[i * 3 + 1] = origin[1] + life * 3.2;
      pos.array[i * 3 + 2] = origin[2] + s.dz + Math.cos(t * 1.7 + s.wobble) * 0.18;
    });
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={tex}
        color="#ffb05a"
        size={0.24}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
