"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "@/lib/noise";
import { heightAt, isReserved, riverX } from "@/lib/world";
import { facet, outlineMaterial, toon } from "@/lib/toon";

const PETAL_COLORS = ["#e8c49a", "#e6b28a", "#d99a83", "#f0d8b4", "#c6f04e", "#9ad0c4"];

// Scattered wildflower dots along the valley floor and river bank - small
// warm touches of colour that break up the greens.
export default function Flowers({ count = 90 }) {
  const fillRef = useRef();
  const lineRef = useRef();

  const geometry = useMemo(() => facet(new THREE.IcosahedronGeometry(1, 1)), []);
  const colorMat = useMemo(() => toon("#e8c49a"), []);
  useLayoutEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const data = useMemo(() => {
    const rand = mulberry32(88);
    const out = [];
    let tries = 0;
    while (out.length < count && tries < count * 20) {
      tries++;
      const z = -20 + rand() * 34;
      const x = riverX(z) + (rand() - 0.5) * 16;
      if (isReserved(x, z) && rand() < 0.7) continue;
      const y = heightAt(x, z);
      if (y < -0.4 || y > 9) continue;
      out.push({
        x,
        y: y + 0.22,
        z,
        s: 0.5 + rand() * 0.9,
        rot: rand() * Math.PI,
        c: Math.floor(rand() * PETAL_COLORS.length),
        sh: 0.95 + rand() * 0.1,
      });
    }
    return out;
  }, [count]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const col = new THREE.Color();

    const fill = (mesh, scaleK, withColor) => {
      if (!mesh) return;
      data.forEach((f, i) => {
        e.set(0, f.rot, 0);
        q.setFromEuler(e);
        p.set(f.x, f.y, f.z);
        sc.setScalar(f.s * scaleK);
        m.compose(p, q, sc);
        mesh.setMatrixAt(i, m);
        if (withColor) {
          col.set(PETAL_COLORS[f.c]).multiplyScalar(f.sh);
          mesh.setColorAt(i, col);
        }
      });
      mesh.count = data.length;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };

    fill(lineRef.current, 1.06, false);
    fill(fillRef.current, 1, true);
  }, [data]);

  return (
    <group>
      <instancedMesh
        ref={lineRef}
        args={[geometry, outlineMaterial, Math.max(1, data.length)]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={fillRef}
        args={[geometry, colorMat, Math.max(1, data.length)]}
        frustumCulled={false}
      />
    </group>
  );
}
