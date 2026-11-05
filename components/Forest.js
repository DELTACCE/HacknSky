"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { fbm, mulberry32, smoothstep } from "@/lib/noise";
import { heightAt, isReserved, slopeAt } from "@/lib/world";
import { timeUniform } from "@/lib/shaders";
import { facet, gradientMap, outlineMaterial, toon } from "@/lib/toon";

const PINE_COLORS = ["#3f7355", "#4f8763", "#639b6b", "#356350", "#7aa864"];
const ROUND_COLORS = ["#7f9c50", "#96ac5b", "#678f4e", "#acb964", "#597f48"];
const CYPRESS_COLORS = ["#35604b", "#447257", "#527f60"];
const BLOSSOM_COLORS = ["#c67d6c", "#d99a83", "#b86b5f", "#e0b08f"];

function buildPineGeometry() {
  const tiers = [
    [1.05, 1.7, 0.85],
    [0.86, 1.55, 1.7],
    [0.64, 1.4, 2.45],
    [0.42, 1.25, 3.1],
    [0.22, 0.95, 3.65],
  ];
  const parts = tiers.map(([r, h, y]) => {
    const g = new THREE.ConeGeometry(r, h, 7, 1, true);
    g.translate(0, y + h / 2 - 0.3, 0);
    return g;
  });
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return facet(merged);
}

function buildRoundGeometry() {
  const lobes = [
    [0, 2.05, 0, 1.0],
    [-0.58, 1.9, 0.18, 0.74],
    [0.52, 2.02, -0.12, 0.8],
    [0, 2.62, 0.02, 0.58],
  ];
  const parts = lobes.map(([x, y, z, r]) => {
    const g = new THREE.IcosahedronGeometry(r, 1);
    g.scale(1, 0.82, 1);
    g.translate(x, y, z);
    return facet(g);
  });
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return merged;
}

function buildCypressGeometry() {
  const tiers = [
    [0.62, 2.2, 1.0],
    [0.46, 1.9, 2.6],
    [0.26, 1.6, 3.9],
  ];
  const parts = tiers.map(([r, h, y]) => {
    const g = new THREE.ConeGeometry(r, h, 6, 1, true);
    g.translate(0, y + h / 2 - 0.2, 0);
    return g;
  });
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return facet(merged);
}

function buildTrunkGeometry() {
  const g = facet(new THREE.CylinderGeometry(0.1, 0.19, 1.9, 5, 1));
  g.translate(0, 0.95, 0);
  return g;
}

function makeFoliageMaterial() {
  const m = new THREE.MeshToonMaterial({ gradientMap });
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
          transformed.x += sin(uTime * 1.15 + swayPhase) * 0.045 * swayAmt;
          transformed.z += cos(uTime * 0.95 + swayPhase * 1.3) * 0.03 * swayAmt;
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
  while (out.length < count && tries < count * 16) {
    tries++;
    const x = x0 + rand() * (x1 - x0);
    const z = z0 + rand() * (z1 - z0);
    if (isReserved(x, z)) continue;
    const n = fbm(x * 0.07 + seed, z * 0.07 - seed);
    if (rand() > 0.2 + 0.8 * smoothstep(0.38, 0.62, n)) continue;
    const y = heightAt(x, z);
    if (y > maxHeight || y < -0.5) continue;
    if (slopeAt(x, z) > maxSlope) continue;
    const kind =
      rand() < 0.18 ? "cypress" : y < 9 && rand() < 0.58 ? "round" : "pine";
    out.push({
      x,
      y,
      z,
      s: 0.66 + rand() * 1.18,
      rot: rand() * Math.PI * 2,
      tiltX: (rand() - 0.5) * 0.045,
      tiltZ: (rand() - 0.5) * 0.045,
      kind,
      blossom: kind === "round" && rand() < 0.08,
      tint: Math.floor(rand() * 5),
      shade: 0.94 + rand() * 0.12,
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
  const cypressRef = useRef();
  const pineLineRef = useRef();
  const roundLineRef = useRef();
  const cypressLineRef = useRef();

  const data = useMemo(() => {
    const trees = scatter({ bounds, count, seed, maxHeight, maxSlope });
    return {
      all: trees,
      pines: trees.filter((t) => t.kind === "pine"),
      rounds: trees.filter((t) => t.kind === "round"),
      cypress: trees.filter((t) => t.kind === "cypress"),
    };
  }, [bounds, count, seed, maxHeight, maxSlope]);

  const assets = useMemo(
    () => ({
      trunk: buildTrunkGeometry(),
      pine: buildPineGeometry(),
      round: buildRoundGeometry(),
      cypress: buildCypressGeometry(),
      trunkMat: toon("#75503b"),
      pineMat: makeFoliageMaterial(),
      roundMat: makeFoliageMaterial(),
      cypressMat: makeFoliageMaterial(),
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
        e.set(t.tiltX, t.rot, t.tiltZ);
        q.setFromEuler(e);
        p.set(t.x, t.y - 0.1, t.z);
        sc.setScalar(t.s * scaleK);
        m.compose(p, q, sc);
        mesh.setMatrixAt(i, m);
        if (withColor) {
          const pick = t.blossom ? BLOSSOM_COLORS : palette;
          col.set(pick[t.tint % pick.length]).multiplyScalar(t.shade);
          mesh.setColorAt(i, col);
        }
      });
      mesh.count = list.length;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };

    fill(pineLineRef.current, data.pines, null, false, 1.018);
    fill(roundLineRef.current, data.rounds, null, false, 1.018);
    fill(cypressLineRef.current, data.cypress, null, false, 1.018);
    fill(trunkRef.current, data.all, null, false);
    fill(pineRef.current, data.pines, PINE_COLORS, true);
    fill(roundRef.current, data.rounds, ROUND_COLORS, true);
    fill(cypressRef.current, data.cypress, CYPRESS_COLORS, true);
  }, [data]);

  useLayoutEffect(
    () => () => {
      assets.trunk.dispose();
      assets.pine.dispose();
      assets.round.dispose();
      assets.cypress.dispose();
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
        ref={cypressLineRef}
        args={[assets.cypress, outlineMaterial, Math.max(1, data.cypress.length)]}
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
      <instancedMesh
        ref={cypressRef}
        args={[assets.cypress, assets.cypressMat, Math.max(1, data.cypress.length)]}
        frustumCulled={false}
      />
    </group>
  );
}
