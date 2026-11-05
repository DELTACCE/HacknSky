"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { softDiscTexture } from "@/lib/sprites";
import { timeUniform } from "@/lib/shaders";
import { heightAt, riverX } from "@/lib/world";

// Soft watercolour mist: a few camera-facing sprites at the river and the
// left edge of the valley, where the hero type needs a quiet backdrop.
export default function Mist() {
  const refs = useRef([]);
  const tex = useMemo(() => softDiscTexture(), []);

  const seeds = useMemo(() => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const z = -24 + i * 6.5;
      out.push({
        x: riverX(z) + (i % 2 ? 3.4 : -3.6),
        y: heightAt(riverX(z), z) + 1.8 + (i % 3) * 1.2,
        z,
        scale: 5.5 + (i % 4) * 1.6,
        opacity: 0.14 + (i % 3) * 0.035,
        drift: 0.3 + (i % 4) * 0.1,
      });
    }
    out.push({ x: -38, y: 10, z: -4, scale: 16, opacity: 0.1, drift: 0.12 });
    return out;
  }, []);

  useFrame(() => {
    const t = timeUniform.value;
    refs.current.forEach((s, i) => {
      if (!s) return;
      const p = seeds[i];
      s.position.x = p.x + Math.sin(t * p.drift + i) * 1.6;
      s.position.y = p.y + Math.cos(t * p.drift * 0.8 + i) * 0.5;
    });
  });

  return (
    <group>
      {seeds.map((s, i) => (
        <sprite
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={[s.x, s.y, s.z]}
          scale={[s.scale, s.scale * 0.55, 1]}
        >
          <spriteMaterial
            map={tex}
            color="#f7e7cf"
            transparent
            opacity={s.opacity}
            depthWrite={false}
            fog
          />
        </sprite>
      ))}
    </group>
  );
}
