"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Collapse a static subtree of hand-built props into one mesh per material and
// one shared outline mesh. The originals stay mounted but invisible, so React
// keeps ownership of them and the scene graph stays easy to edit.
// Dynamic groups (gondolas, instanced fields, particles) are wrapped
// individually and keep moving normally because their merged mesh lives inside
// the same group.
export default function StaticBatch({ children, name = "batch" }) {
  const ref = useRef();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.updateWorldMatrix(true, true);

    const inverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const groups = new Map();
    const hidden = [];
    const added = [];

    root.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.isSprite || o.isPoints) return;
      if (!o.geometry || !o.material || o.userData.noBatch) return;
      if (o.geometry.attributes.color) return; // vertex-coloured props stay as-is
      const key = o.material.uuid;
      if (!groups.has(key)) groups.set(key, { material: o.material, geometries: [] });
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
      groups.get(key).geometries.push(geo);
      hidden.push(o);
    });

    groups.forEach(({ material, geometries }) => {
      const merged = mergeGeometries(geometries, false);
      geometries.forEach((g) => g.dispose());
      if (!merged) return;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, material);
      mesh.name = `${name}-${material.type}-${material.color?.getHexString?.() || "x"}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
      added.push(mesh);
    });

    hidden.forEach((o) => {
      o.visible = false;
    });

    return () => {
      added.forEach((m) => {
        root.remove(m);
        m.geometry.dispose();
      });
      hidden.forEach((o) => {
        o.visible = true;
      });
    };
  }, [name]);

  return <group ref={ref}>{children}</group>;
}
