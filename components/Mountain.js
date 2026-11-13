"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { buildPeakGeometry } from "@/lib/lowpoly";
import { mulberry32 } from "@/lib/noise";
import { toonVertexColors } from "@/lib/toon";

// Distant faceted ranges that frame the valley. All peaks are merged into one
// fill mesh, so the whole horizon costs a single draw call. No inverted-hull
// outline here: on sharp distant ridges the black shell pokes through the fill
// and reads as holes/dark triangles, so the peaks rely on their own shading.
export default function Mountain() {
  const { geometry, material } = useMemo(() => {
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

    const fills = [];
    const baseY = -9;
    const one = new THREE.Vector3(1, 1, 1);

    list.forEach((p, i) => {
      const g = buildPeakGeometry({
        radius: p.radius,
        height: p.height,
        seed: i + 1,
        radial: 8,
        heightSegs: 5,
      });
      const pos = new THREE.Vector3(p.x, baseY, p.z);
      const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i * 0.9, 0));
      g.applyMatrix4(new THREE.Matrix4().compose(pos, quat, one));
      fills.push(g);
    });

    const merged = mergeGeometries(fills, false);
    fills.forEach((g) => g.dispose());
    merged.computeBoundingSphere();

    // Double-sided: if any facet ends up wound backwards after jitter it still
    // fills instead of showing the sky through a triangular hole.
    return { geometry: merged, material: toonVertexColors({ side: THREE.DoubleSide }) };
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry} material={material} />;
}
