"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { heightAt, isReserved, slopeAt } from "@/lib/world";
import { mulberry32 } from "@/lib/noise";
import { facet, toon } from "@/lib/toon";

// Low shrubs and flower clumps break up the forest floor without another
// draw call per plant.
export default function Undergrowth({ count = 150, seed = 31 }) {
  const ref = useRef();
  const geometry = useMemo(() => facet(new THREE.IcosahedronGeometry(1, 0)), []);
  const material = useMemo(() => toon("#ffffff"), []);

  const instances = useMemo(() => {
    const rand = mulberry32(seed);
    const colors = ["#557a4c", "#6c8d55", "#829b5f", "#456b48", "#c6f04e", "#b85c3e", "#d7a78c"];
    const out = [];
    let guard = 0;
    while (out.length < count && guard < count * 40) {
      guard++;
      const x = -70 + rand() * 140;
      const z = -72 + rand() * 100;
      if (isReserved(x, z) || slopeAt(x, z) > 1.15) continue;
      const y = heightAt(x, z);
      if (y < -1) continue;
      const s = 0.35 + rand() * 0.95;
      out.push({
        x,
        y: y + s * 0.2,
        z,
        sx: s * (0.9 + rand() * 0.7),
        sy: s * (0.45 + rand() * 0.35),
        sz: s * (0.9 + rand() * 0.7),
        ry: rand() * Math.PI * 2,
        color: colors[Math.floor(rand() * colors.length)],
      });
    }
    return out;
  }, [count, seed]);

  useEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    instances.forEach((p, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.ry);
      m.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(p.sx, p.sy, p.sz));
      ref.current.setMatrixAt(i, m);
      ref.current.setColorAt(i, c.set(p.color));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [instances]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, instances.length]}
      frustumCulled={false}
    />
  );
}
