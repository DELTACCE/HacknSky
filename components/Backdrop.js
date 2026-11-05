"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { fbm } from "@/lib/noise";

// Two flat, hand-cut ridge silhouettes far behind the modelled valley. They
// are unlit on purpose: the colour shift is the atmospheric perspective.
function buildRidge({ width, baseY, height, z, seed, segs = 150, bottom, top }) {
  const positions = [];
  const colors = [];
  const cBottom = new THREE.Color(bottom);
  const cTop = new THREE.Color(top);

  const profile = (u) => {
    const broad = fbm(u * 5.5 + seed, seed * 2.7, 4);
    const jag = Math.abs(Math.sin(u * Math.PI * 7 + seed * 1.9)) * 0.35;
    return height * (0.22 + broad * 0.62 + jag);
  };

  let prevX = -width / 2;
  let prevY = baseY + profile(0);
  for (let i = 1; i <= segs; i++) {
    const u = i / segs;
    const x = -width / 2 + u * width;
    const y = baseY + profile(u);

    // two triangles: (prevBottom, prevTop, xTop) and (prevBottom, xTop, xBottom)
    positions.push(prevX, baseY, z, prevX, prevY, z, x, y, z);
    positions.push(prevX, baseY, z, x, y, z, x, baseY, z);

    colors.push(cBottom.r, cBottom.g, cBottom.b);
    colors.push(cTop.r, cTop.g, cTop.b);
    colors.push(cTop.r, cTop.g, cTop.b);
    colors.push(cBottom.r, cBottom.g, cBottom.b);
    colors.push(cTop.r, cTop.g, cTop.b);
    colors.push(cBottom.r, cBottom.g, cBottom.b);

    prevX = x;
    prevY = y;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

export default function Backdrop() {
  const ridges = useMemo(
    () => [
      {
        geometry: buildRidge({
          width: 720,
          baseY: -44,
          height: 150,
          z: -260,
          seed: 4.2,
          bottom: "#a9c9ca",
          top: "#d8e8e2",
        }),
        material: new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }),
      },
      {
        geometry: buildRidge({
          width: 560,
          baseY: -36,
          height: 105,
          z: -190,
          seed: 9.1,
          bottom: "#7fae9f",
          top: "#b4cfbd",
        }),
        material: new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }),
      },
    ],
    []
  );

  useEffect(
    () => () => {
      ridges.forEach((r) => {
        r.geometry.dispose();
        r.material.dispose();
      });
    },
    [ridges]
  );

  return (
    <group>
      {ridges.map((r, i) => (
        <mesh key={i} geometry={r.geometry} material={r.material} renderOrder={-0.5} />
      ))}
    </group>
  );
}
