"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

// A cheap contact shadow for structures on the flattened pads. It keeps props
// from looking glued-on when the real shadow map is disabled on mobile.
export function GroundBlob({ position = [0, 0.035, 0], radius = 4, opacity = 0.16 }) {
  const geo = useMemo(() => new THREE.CircleGeometry(1, 18), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#10241c",
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    [opacity]
  );
  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      geometry={geo}
      material={material}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[radius, radius * 0.82, 1]}
      renderOrder={1}
      userData={{ noBatch: true }}
    />
  );
}
