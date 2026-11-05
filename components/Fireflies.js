"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { softDiscTexture } from "@/lib/sprites";
import { timeUniform } from "@/lib/shaders";
import { mulberry32 } from "@/lib/noise";
import { PADS, heightAt } from "@/lib/world";

export default function Fireflies({ count = 42 }) {
  const ref = useRef();
  const tex = useMemo(() => softDiscTexture(), []);
  const seeds = useMemo(() => {
    const rand = mulberry32(44);
    const venue = PADS.find((p) => p.id === "venue");
    const park = PADS.find((p) => p.id === "waterpark");
    return Array.from({ length: count }, (_, i) => {
      const p = i % 3 === 0 ? park : venue;
      return {
        x: p.x + (rand() - 0.5) * 13,
        z: p.z + (rand() - 0.5) * 12,
        y: heightAt(p.x, p.z) + 1 + rand() * 4,
        phase: rand() * Math.PI * 2,
        speed: 0.4 + rand() * 0.7,
        amp: 0.5 + rand() * 1.1,
      };
    });
  }, [count]);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    seeds.forEach((s, i) => {
      arr[i * 3] = s.x;
      arr[i * 3 + 1] = s.y;
      arr[i * 3 + 2] = s.z;
    });
    return arr;
  }, [count, seeds]);

  useFrame(() => {
    if (!ref.current) return;
    const t = timeUniform.value;
    const pos = ref.current.geometry.attributes.position;
    seeds.forEach((s, i) => {
      pos.array[i * 3] = s.x + Math.sin(t * s.speed + s.phase) * s.amp;
      pos.array[i * 3 + 1] = s.y + Math.cos(t * s.speed * 0.7 + s.phase) * 0.7;
      pos.array[i * 3 + 2] = s.z + Math.cos(t * s.speed + s.phase) * s.amp * 0.7;
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
        color="#ffd37a"
        size={0.55}
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        alphaTest={0.02}
      />
    </points>
  );
}
