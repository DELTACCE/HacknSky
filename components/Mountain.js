"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { buildPeakGeometry } from "@/lib/lowpoly";
import { mulberry32 } from "@/lib/noise";
import { outlineMaterial, toonVertexColors } from "@/lib/toon";

// Distant faceted ranges that frame the valley. All peaks are merged into one
// fill mesh and one outline mesh so the horizon costs two draw calls instead
// of forty.
export default function Mountain() {
  const { geometry, outlineGeometry, material } = useMemo(() => {
    const rand = mulberry32(21);
    const list = [];

    // back wall
    for (let x = -110; x <= 110; x += 19) {
      list.push({
        x: x + (rand() - 0.5) * 8,
        z: -96 + (rand() - 0.5) * 10,
        radius: 20 + rand() * 10,
        height: 40 + rand() * 18,
        rot: 0,
      });
    }
    // a nearer rank sits just in front of the back wall, darker and greener,
    // so the horizon reads as several distinct ridges rather than one cutout
    for (let x = -66; x <= 66; x += 22) {
      list.push({
        x: x + (rand() - 0.5) * 10,
        z: -87 + (rand() - 0.5) * 4,
        radius: 14 + rand() * 6,
        height: 24 + rand() * 12,
        rot: rand() * 1.4,
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
          rot: i * 0.9,
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
          rot: z * 0.2,
        });
      }
    }

    const fills = [];
    const lines = [];
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scale = new THREE.Vector3();

    const nearTint = new THREE.Color("#3d6150");
    const c = new THREE.Color();
    list.forEach((p, i) => {
      const g = buildPeakGeometry({
        radius: p.radius,
        height: p.height,
        seed: i + 1,
        radial: 8,
        heightSegs: 5,
      });
      if (p.z > -93) {
        const attr = g.attributes.color;
        for (let v = 0; v < attr.count; v++) {
          c.fromBufferAttribute(attr, v).lerp(nearTint, 0.4);
          attr.setXYZ(v, c.r, c.g, c.b);
        }
      }
      const m = new THREE.Matrix4();
      euler.set(0, p.rot, 0);
      quat.setFromEuler(euler);
      pos.set(p.x, -5, p.z);
      scale.set(1, 1, 1);
      m.compose(pos, quat, scale);
      const fill = g.clone();
      fill.applyMatrix4(m);
      fills.push(fill);
      const line = g.clone();
      line.applyMatrix4(new THREE.Matrix4().compose(pos, quat, scale.set(1.008, 1.008, 1.008)));
      lines.push(line);
      g.dispose();
    });

    const mergedFill = mergeGeometries(fills, false);
    const mergedLine = mergeGeometries(lines, false);
    fills.forEach((g) => g.dispose());
    lines.forEach((g) => g.dispose());
    mergedFill.computeBoundingSphere();
    mergedLine.computeBoundingSphere();

    return {
      geometry: mergedFill,
      outlineGeometry: mergedLine,
      material: toonVertexColors(),
    };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      outlineGeometry.dispose();
    },
    [geometry, outlineGeometry]
  );

  return (
    <group>
      <mesh geometry={geometry} material={material} />
      <mesh geometry={outlineGeometry} material={outlineMaterial} />
    </group>
  );
}
