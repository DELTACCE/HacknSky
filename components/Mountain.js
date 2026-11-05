"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { buildPeakGeometry } from "@/lib/lowpoly";
import { mulberry32 } from "@/lib/noise";
import { outlineMaterial, toonVertexColors } from "@/lib/toon";

// Distant faceted ranges that frame the valley. Colours fade into the fog,
// which is what gives the scene its soft, layered depth.
export default function Mountain() {
  const { peaks, material } = useMemo(() => {
    const rand = mulberry32(21);
    const list = [];

    // back wall
    for (let x = -110; x <= 110; x += 19) {
      list.push({
        x: x + (rand() - 0.5) * 8,
        z: -96 + (rand() - 0.5) * 10,
        radius: 20 + rand() * 10,
        height: 40 + rand() * 18,
      });
    }
    // second row, pushed to the flanks so the valley stays open
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        list.push({
          x: side * (50 + i * 20 + rand() * 6),
          z: -78 + (rand() - 0.5) * 8,
          radius: 17 + rand() * 7,
          height: 28 + rand() * 12,
        });
      }
    }
    // side ranges running toward the camera
    for (const side of [-1, 1]) {
      for (let z = -56; z <= 22; z += 19) {
        list.push({
          x: side * (84 + rand() * 8),
          z: z + (rand() - 0.5) * 6,
          radius: 19 + rand() * 6,
          height: 26 + rand() * 12,
        });
      }
    }

    const built = list.map((p, i) => ({
      ...p,
      geometry: buildPeakGeometry({
        radius: p.radius,
        height: p.height,
        seed: i + 1,
        radial: 8,
        heightSegs: 5,
      }),
    }));

    return { peaks: built, material: toonVertexColors() };
  }, []);

  useEffect(
    () => () => {
      peaks.forEach((p) => p.geometry.dispose());
    },
    [peaks]
  );

  return (
    <group>
      {peaks.map((p, i) => (
        <group key={i} position={[p.x, -5, p.z]} rotation={[0, i * 0.9, 0]}>
          <mesh geometry={p.geometry} material={material} />
          <mesh geometry={p.geometry} material={outlineMaterial} scale={1.02} />
        </group>
      ))}
    </group>
  );
}
