"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { fbm, mulberry32, smoothstep } from "@/lib/noise";
import { heightAt, isReserved, slopeAt } from "@/lib/world";
import { timeUniform } from "@/lib/shaders";
import { facet, gradientMap, outlineMaterial, toon } from "@/lib/toon";

const PINE_COLORS = ["#2f8a52", "#3fa15e", "#4fb56a", "#25714a", "#6cc45a"];
const ROUND_COLORS = ["#8ed05e", "#a3dd6d", "#6fbe58", "#b6e37e", "#5aa84f"];

function buildPineGeometry() {
  const tiers = [
    [1.15, 1.9, 0.9],
    [0.9, 1.7, 1.85],
    [0.62, 1.5, 2.7],
    [0.34, 1.1, 3.45],
  ];
  const parts = tiers.map(([r, h, y]) => {
    const g = new THREE.ConeGeometry(r, h, 6, 1, true);
    g.translate(0, y + h / 2 - 0.3, 0);
    return g;
  });
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return facet(merged);
}

function buildRoundGeometry() {
  const g = facet(new THREE.IcosahedronGeometry(1.05, 0));
  g.scale(1, 0.92, 1);
  g.translate(0, 2.15, 0);
  return g;
}

function buildTrunkGeometry() {
  const g = facet(new THREE.CylinderGeometry(0.11, 0.2, 1.4, 5, 1));
  g.translate(0, 0.7, 0);
  return g;
}

// Foliage sways in the vertex shader from the shared clock, so trees move
// without touching instance matrices on the CPU.
function makeFoliageMaterial() {
  const m = new THREE.MeshToonMaterial({
    gradientMap,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeUniform;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float swayPhase = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.5;
          float swayAmt = max(position.y, 0.0);
          transformed.x += sin(uTime * 1.3 + swayPhase) * 0.05 * swayAmt;
          transformed.z += cos(uTime * 1.1 + swayPhase * 1.3) * 0.035 * swayAmt;
        #endif`
      );
  };
  return m;
}

function scatter({ bounds, count, seed, maxHeight, maxSlope }) {
  const rand = mulberry32(seed);
  const out = [];
  const { x0, x1, z0, z1 } = bounds;
  let tries = 0;
  while (out.length < count && tries < count * 14) {
    tries++;
    const x = x0 + rand() * (x1 - x0);
    const z = z0 + rand() * (z1 - z0);
    if (isReserved(x, z)) continue;
    // clustered groves with natural clearings
    const n = fbm(x * 0.07 + seed, z * 0.07 - seed);
    if (rand() > 0.22 + 0.78 * smoothstep(0.38, 0.62, n)) continue;
    const y = heightAt(x, z);
    if (y > maxHeight || y < -0.5) continue;
    if (slopeAt(x, z) > maxSlope) continue;
    out.push({
      x,
      y,
      z,
      s: 0.75 + rand() * 0.95,
      rot: rand() * Math.PI * 2,
      round: y < 7 && rand() < 0.42,
      tint: Math.floor(rand() * 5),
      shade: 0.9 + rand() * 0.2,
    });
  }
  return out;
}

export default function Forest({
  count = 800,
  seed = 3,
  bounds = { x0: -72, x1: 72, z0: -60, z1: 26 },
  maxHeight = 21,
  maxSlope = 2.3,
}) {
  const trunkRef = useRef();
  const pineRef = useRef();
  const roundRef = useRef();
  const pineLineRef = useRef();
  const roundLineRef = useRef();

  const data = useMemo(() => {
    const trees = scatter({ bounds, count, seed, maxHeight, maxSlope });
    return {
      all: trees,
      pines: trees.filter((t) => !t.round),
      rounds: trees.filter((t) => t.round),
    };
  }, [bounds, count, seed, maxHeight, maxSlope]);

  const assets = useMemo(
    () => ({
      trunk: buildTrunkGeometry(),
      pine: buildPineGeometry(),
      round: buildRoundGeometry(),
      trunkMat: toon("#7a563d"),
      pineMat: makeFoliageMaterial(),
      roundMat: makeFoliageMaterial(),
    }),
    []
  );

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const col = new THREE.Color();

    const fill = (mesh, list, palette, withColor, scaleK = 1) => {
      if (!mesh) return;
      list.forEach((t, i) => {
        e.set(0, t.rot, 0);
        q.setFromEuler(e);
        p.set(t.x, t.y - 0.1, t.z);
        sc.setScalar(t.s * scaleK);
        m.compose(p, q, sc);
        mesh.setMatrixAt(i, m);
        if (withColor) {
          col.set(palette[t.tint]).multiplyScalar(t.shade);
          mesh.setColorAt(i, col);
        }
      });
      mesh.count = list.length;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };

    fill(pineLineRef.current, data.pines, null, false, 1.045);
    fill(roundLineRef.current, data.rounds, null, false, 1.045);
    fill(trunkRef.current, data.all, null, false);
    fill(pineRef.current, data.pines, PINE_COLORS, true);
    fill(roundRef.current, data.rounds, ROUND_COLORS, true);
  }, [data]);

  useLayoutEffect(
    () => () => {
      // Materials live in the shared toon cache; only these geometries are ours.
      assets.trunk.dispose();
      assets.pine.dispose();
      assets.round.dispose();
    },
    [assets]
  );

  return (
    <group>
      <instancedMesh
        ref={pineLineRef}
        args={[assets.pine, outlineMaterial, Math.max(1, data.pines.length)]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={roundLineRef}
        args={[assets.round, outlineMaterial, Math.max(1, data.rounds.length)]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={trunkRef}
        args={[assets.trunk, assets.trunkMat, Math.max(1, data.all.length)]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={pineRef}
        args={[assets.pine, assets.pineMat, Math.max(1, data.pines.length)]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={roundRef}
        args={[assets.round, assets.roundMat, Math.max(1, data.rounds.length)]}
        frustumCulled={false}
      />
    </group>
  );
}
