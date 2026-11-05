"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { heightAt, padHeightOf, PADS, riverX } from "@/lib/world";
import { colorize } from "@/lib/lowpoly";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { facet, outlineMaterial, toonVertexColors } from "@/lib/toon";
import { Box, Cone, Cyl, PALETTE, Rock, mat } from "./primitives";
import { createWaterMaterial } from "@/lib/shaders";
import StaticBatch from "./StaticBatch";
import { GroundBlob } from "./GroundBlob";

const pad = (id) => PADS.find((p) => p.id === id);

export function Venue() {
  const p = pad("venue");
  return (
    <group position={[p.x, padHeightOf("venue"), p.z]}>
      <GroundBlob radius={6.1} opacity={0.15} />
      {/* foundation */}
      <Box size={[9.4, 0.8, 7.4]} position={[0.8, 0, 0]} color={PALETTE.stone} />
      {/* main hall: plaster walls under a tiled Kerala hip roof */}
      <Box size={[6, 2.6, 4]} position={[0, 1.7, 0]} color={PALETTE.paper} />
      <Box size={[7.3, 0.14, 5.3]} position={[0, 3.06, 0]} color={PALETTE.woodDark} />
      <Box size={[6.8, 0.12, 4.8]} position={[0, 3.15, 0]} color={PALETTE.clay} />
      <Cone radial={4} size={[4.9, 1.85, 3.55]} position={[0, 3.95, 0]} color={PALETTE.clay} />
      <Cone radial={4} size={[4.35, 0.13, 3.15]} position={[0, 4.3, 0]} color="#a34f36" />
      <Cone radial={4} size={[3.55, 0.12, 2.55]} position={[0, 4.72, 0]} color="#a34f36" />
      <Box size={[0.22, 0.18, 3.1]} position={[0, 5.16, 0]} color={PALETTE.woodDark} />
      <Box size={[2.4, 0.55, 0.1]} position={[0, 2.55, 2.06]} color={PALETTE.lime} />
      <Box size={[0.98, 1.5, 0.1]} position={[-1.9, 1.15, 2.03]} color={PALETTE.woodDark} />
      <Box size={[0.78, 1.3, 0.08]} position={[-1.9, 1.15, 2.09]} color={PALETTE.emerald} />
      <Box size={[1.2, 0.92, 0.08]} position={[1.5, 1.66, 2.07]} color={PALETTE.woodDark} />
      <Box size={[1.02, 0.76, 0.06]} position={[1.5, 1.66, 2.12]} color={PALETTE.glass} />

      {/* veranda, wooden posts, railing and lanterns */}
      <Box size={[6.5, 0.12, 1.9]} position={[0, 2.92, 2.78]} color={PALETTE.woodDark} />
      {[-2.6, 2.6].map((x) => (
        <Cyl key={x} radial={6} size={[0.09, 2.1, 0.09]} position={[x, 1.9, 3.62]} color={PALETTE.wood} />
      ))}
      <Box size={[5.4, 0.08, 0.08]} position={[0, 1.15, 3.62]} color={PALETTE.wood} />
      {[-2.2, -1.1, 0, 1.1, 2.2].map((x) => (
        <Box key={x} size={[0.07, 0.9, 0.07]} position={[x, 0.75, 3.62]} color={PALETTE.wood} />
      ))}
      {[-2.55, 2.55].map((x) => (
        <group key={x} position={[x, 2.62, 2.72]}>
          <Box size={[0.04, 0.3, 0.04]} position={[0, 0.15, 0]} color={PALETTE.ink} />
          <Box size={[0.2, 0.28, 0.2]} position={[0, -0.05, 0]} color={PALETTE.clay} />
          <mesh position={[0, -0.05, 0.11]}>
            <sphereGeometry args={[0.1, 6, 5]} />
            <meshBasicMaterial color={PALETTE.glow} />
          </mesh>
        </group>
      ))}

      {/* bunting across the veranda */}
      <Box size={[5.6, 0.025, 0.025]} position={[0, 3.28, 3.15]} color={PALETTE.ink} />
      {Array.from({ length: 9 }).map((_, i) => {
        const t = i / 8;
        const x = -2.7 + t * 5.4;
        const y = 3.24 - Math.sin(t * Math.PI) * 0.16;
        const colors = [PALETTE.lime, PALETTE.cream, PALETTE.clay, PALETTE.sky];
        return (
          <Cone
            key={i}
            radial={3}
            size={[0.15, 0.34, 0.04]}
            position={[x, y - 0.16, 3.15]}
            rotation={[0, 0, Math.PI]}
            color={colors[i % colors.length]}
          />
        );
      })}

      {/* annex */}
      <Box size={[2.4, 1.6, 2.6]} position={[4.2, 1.2, 0.4]} color={PALETTE.paper} />
      <Box size={[2.9, 0.12, 3.1]} position={[4.2, 2.02, 0.4]} color={PALETTE.woodDark} />
      <Cone radial={4} size={[1.85, 1.05, 2.05]} position={[4.2, 2.55, 0.4]} color={PALETTE.clay} />
      {/* flag */}
      <Cyl radial={5} size={[0.06, 4.5, 0.06]} position={[-3.3, 2.65, 1.9]} color={PALETTE.ink} />
      <Box size={[1.0, 0.6, 0.05]} position={[-2.8, 4.35, 1.9]} color={PALETTE.lime} />
      {/* tents */}
      <Cone radial={6} size={[0.95, 1.2, 0.95]} position={[-4.4, 1.0, -2.8]} color={PALETTE.lime} />
      <Cone radial={6} size={[0.85, 1.1, 0.85]} position={[-3.0, 0.95, -3.7]} color={PALETTE.sky} />

      {/* campfire and string lights */}
      <pointLight position={[3.6, 1.4, 2.9]} intensity={4.5} distance={14} decay={2} color="#ffb05a" />
      <group position={[3.6, 0.5, 2.9]}>
        <Cyl radial={5} size={[0.1, 0.9, 0.1]} rotation={[0, 0, Math.PI / 2]} color={PALETTE.woodDark} />
        <Cyl radial={5} size={[0.1, 0.9, 0.1]} rotation={[0, Math.PI / 3, Math.PI / 2]} color={PALETTE.wood} />
        <Cone radial={5} size={[0.32, 0.75, 0.32]} position={[0, 0.3, 0]} color={PALETTE.clay} matProps={{ emissive: "#ff9a3c", emissiveIntensity: 0.7 }} />
        <Cone radial={5} size={[0.18, 0.48, 0.18]} position={[0, 0.38, 0]} color={PALETTE.lime} matProps={{ emissive: PALETTE.lime, emissiveIntensity: 0.5 }} />
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <Rock
              key={i}
              position={[Math.cos(a) * 0.62, -0.08, Math.sin(a) * 0.62]}
              size={[0.17, 0.12, 0.17]}
              rotation={[0, a, 0]}
            />
          );
        })}
      </group>

      <Cyl radial={5} size={[0.06, 3.2, 0.06]} position={[-4.3, 1.6, -3.5]} color={PALETTE.ink} />
      <Cyl radial={5} size={[0.06, 3.2, 0.06]} position={[4.3, 1.6, -3.5]} color={PALETTE.ink} />
      {Array.from({ length: 9 }).map((_, i) => {
        const t = i / 8;
        const x = -4.3 + t * 8.6;
        const y = 3.35 - Math.sin(t * Math.PI) * 0.55;
        return (
          <mesh key={i} position={[x, y, -3.5]}>
            <sphereGeometry args={[0.085, 6, 5]} />
            <meshBasicMaterial color={PALETTE.glow} />
          </mesh>
        );
      })}
    </group>
  );
}

function Slide({ points, color }) {
  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((q) => new THREE.Vector3(...q))),
        44,
        0.42,
        6,
        false
      ),
    [points]
  );
  return <mesh geometry={geometry} material={mat(color, { side: THREE.DoubleSide })} />;
}

export function WaterPark() {
  const p = pad("waterpark");
  const water = useMemo(() => createWaterMaterial(), []);
  useEffect(() => () => water.dispose(), [water]);
  return (
    <group position={[p.x, padHeightOf("waterpark"), p.z]}>
      <GroundBlob radius={8.6} opacity={0.13} />
      <Cyl radial={10} size={[8.3, 0.8, 8.3]} position={[0, 0, 0]} color={PALETTE.stone} />
      {/* wave pool */}
      <Cyl radial={9} size={[4.3, 0.5, 4.3]} position={[0, 0.65, 0]} color={PALETTE.paper} />
      <mesh position={[0, 0.74, 0]} scale={[3.8, 0.5, 3.8]}>
        <cylinderGeometry args={[1, 1, 1, 9]} />
        <primitive object={water} attach="material" />
      </mesh>
      {/* lazy river ring */}
      <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.5]}>
        <torusGeometry args={[6.2, 0.55, 4, 18]} />
        <primitive object={water} attach="material" />
      </mesh>
      {/* slide towers + slides */}
      <Box size={[1.4, 4.8, 1.4]} position={[-6, 2.8, -2.2]} color={PALETTE.paper} />
      <Box size={[1.4, 4.0, 1.4]} position={[6, 2.4, -2.2]} color={PALETTE.paper} />
      <Slide
        color={PALETTE.lime}
        points={[
          [-6, 5.2, -2.2],
          [-8.4, 4.4, 0],
          [-6.8, 3.2, 3.6],
          [-3, 2.0, 4.6],
          [-0.5, 1.1, 3.2],
        ]}
      />
      <Slide
        color={PALETTE.sky}
        points={[
          [6, 4.4, -2.2],
          [8.5, 3.6, 0.5],
          [6.5, 2.6, 3.8],
          [3, 1.6, 4.6],
          [1.2, 1.0, 3.4],
        ]}
      />
      {/* tower roofs and slide supports */}
      <Cone radial={4} size={[1.15, 0.65, 1.15]} position={[-6, 5.45, -2.2]} color={PALETTE.lime} />
      <Cone radial={4} size={[1.15, 0.65, 1.15]} position={[6, 4.7, -2.2]} color={PALETTE.clay} />
      {[
        [-7.7, 3.0, 0.2],
        [-5.4, 2.2, 3.2],
        [7.8, 2.6, 0.5],
        [5.6, 1.8, 3.3],
      ].map(([x, h, z], i) => (
        <Cyl key={i} radial={6} size={[0.11, h, 0.11]} position={[x, h / 2, z]} color={PALETTE.woodDark} />
      ))}

      {/* ring buoys */}
      {[
        [1.9, 2.6],
        [-2.3, 3.4],
        [3.8, -3.0],
      ].map(([x, z], i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[x, 0.86, z]}>
          <torusGeometry args={[0.34, 0.11, 6, 12]} />
          <primitive object={mat(i === 1 ? PALETTE.sky : PALETTE.clay)} attach="material" />
        </mesh>
      ))}

      {/* loungers around the pool */}
      {[
        [4.9, 6.0, 0.5],
        [-5.0, 5.7, -0.4],
        [6.2, -5.2, 2.2],
      ].map(([x, z, r], i) => (
        <group key={i} position={[x, 0.55, z]} rotation={[0, r, 0]}>
          <Box size={[1.3, 0.14, 0.55]} position={[0, 0.2, 0]} color={PALETTE.paper} />
          <Box size={[0.55, 0.14, 0.55]} position={[-0.65, 0.55, 0]} rotation={[0, 0, -0.55]} color={PALETTE.paper} />
          <Box size={[0.1, 0.35, 0.1]} position={[0.45, 0.05, 0.2]} color={PALETTE.woodDark} />
          <Box size={[0.1, 0.35, 0.1]} position={[0.45, 0.05, -0.2]} color={PALETTE.woodDark} />
        </group>
      ))}

      {/* umbrellas */}
      {[
        [-3.4, 6.9, PALETTE.lime],
        [0, 7.4, PALETTE.clay],
        [3.4, 6.9, PALETTE.sky],
      ].map(([x, z, c], i) => (
        <group key={i} position={[x, 0, z]}>
          <Cyl radial={5} size={[0.05, 1.8, 0.05]} position={[0, 1.3, 0]} color={PALETTE.ink} />
          <Cone radial={6} size={[0.95, 0.45, 0.95]} position={[0, 2.42, 0]} color={c} />
        </group>
      ))}
    </group>
  );
}

export function FallsViewpoint() {
  const p = pad("falls");
  return (
    <group position={[p.x, padHeightOf("falls"), p.z]}>
      <GroundBlob radius={2.5} opacity={0.14} />
      <Box size={[3.4, 0.2, 2.4]} position={[0, 0.2, 0]} color={PALETTE.wood} />
      {[-1.6, 1.6].map((x) =>
        [-1.1, 1.1].map((z) => (
          <Box key={`${x}${z}`} size={[0.1, 0.9, 0.1]} position={[x, 0.75, z]} color={PALETTE.woodDark} />
        ))
      )}
      <Box size={[3.2, 0.08, 0.08]} position={[0, 1.15, -1.1]} color={PALETTE.woodDark} />
      <Box size={[0.08, 0.08, 2.2]} position={[-1.6, 1.15, 0]} color={PALETTE.woodDark} />
      <Box size={[0.08, 0.08, 2.2]} position={[1.6, 1.15, 0]} color={PALETTE.woodDark} />
      <Cyl radial={5} size={[0.04, 1.6, 0.04]} position={[1.2, 1.1, 0.8]} color={PALETTE.ink} />
      <Box size={[0.55, 0.32, 0.04]} position={[1.46, 1.75, 0.8]} color={PALETTE.lime} />
    </group>
  );
}

function buildPalmGeometry({ lean = 0, hue = 0 }) {
  const parts = [];
  const add = (geo, color) => {
    if (geo.index) {
      const flat = geo.toNonIndexed();
      geo.dispose();
      geo = flat;
    }
    colorize(geo, color);
    parts.push(geo);
  };

  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const g = new THREE.CylinderGeometry(0.13 - i * 0.012, 0.17 - i * 0.012, 0.82, 7, 1);
    g.translate(lean * (t * t) * 0.9, 0.4 + i * 0.78, 0);
    add(g, i % 2 ? "#6e4a36" : "#7d573d");
  }

  const crownY = 4.35;
  const crownX = lean * 0.9;
  const fronds = 9;
  for (let f = 0; f < fronds; f++) {
    const a = (f / fronds) * Math.PI * 2 + hue;
    const droop = -0.42 - (f % 3) * 0.1;
    for (let seg = 0; seg < 3; seg++) {
      const len = 0.95 - seg * 0.12;
      const width = 0.46 * (1 - seg * 0.23);
      const radius = 0.42 + seg * 0.82;
      const y = crownY + 0.06 - seg * seg * 0.16;
      const g = new THREE.BoxGeometry(len, 0.07, width);
      g.rotateZ(droop + seg * 0.04);
      g.rotateY(-a);
      g.translate(crownX + Math.cos(a) * radius, y, Math.sin(a) * radius);
      add(g, seg === 2 ? (f % 2 ? "#9aad56" : "#7e994b") : f % 2 ? "#5c8249" : "#4d7343");
    }
  }

  for (let i = 0; i < 3; i++) {
    const a = hue + i * 2.1;
    const g = new THREE.IcosahedronGeometry(0.16, 0);
    g.translate(crownX + Math.cos(a) * 0.28, crownY - 0.24, Math.sin(a) * 0.28);
    add(g, "#6b4a33");
  }

  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return facet(merged);
}

function Palm({ x, z, scale = 1, lean = 0, hue = 0 }) {
  const base = heightAt(x, z);
  const geometry = useMemo(() => buildPalmGeometry({ lean, hue }), [lean, hue]);
  const material = useMemo(() => toonVertexColors(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group position={[x, base, z]} scale={scale}>
      <mesh geometry={geometry} material={material} />
      <mesh geometry={geometry} material={outlineMaterial} scale={1.012} />
    </group>
  );
}

function Bridge({ z = 16 }) {
  const rx = riverX(z);
  const deckY = Math.max(heightAt(rx - 5, z), heightAt(rx + 5, z)) + 1.0;
  return (
    <group position={[rx, deckY, z]}>
      {Array.from({ length: 9 }).map((_, i) => {
        const t = i / 8;
        const x = -4 + t * 8;
        return (
          <Box
            key={i}
            size={[0.9, 0.13, 2.6]}
            position={[x, 0.28 + Math.sin(t * Math.PI) * 0.18, 0]}
            color={i % 2 ? PALETTE.wood : PALETTE.woodDark}
          />
        );
      })}
      {[-4.15, 4.15].map((x) => (
        <group key={x}>
          {[-1.18, 1.18].map((pz) => (
            <Box key={pz} size={[0.14, 1.55, 0.14]} position={[x, -0.32, pz]} color={PALETTE.woodDark} />
          ))}
          <Box size={[1.15, 0.26, 2.7]} position={[x, -1.03, 0]} color={PALETTE.stone} />
          <Box size={[0.1, 0.1, 2.5]} position={[x, 1.35, 0]} color={PALETTE.woodDark} />
        </group>
      ))}
      {[-1.18, 1.18].map((pz) => (
        <Box key={pz} size={[8.4, 0.1, 0.1]} position={[0, 1.35, pz]} color={PALETTE.woodDark} />
      ))}
    </group>
  );
}

function Reeds({ count = 34, seed = 8 }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.085, 1.7, 4);
    g.translate(0, 0.82, 0);
    return g;
  }, []);
  const material = useMemo(() => mat("#6f9168"), []);

  const matrices = useMemo(() => {
    let a = seed;
    const rand = () => {
      a = (a * 1664525 + 1013904223) % 4294967296;
      return a / 4294967296;
    };
    return Array.from({ length: count }, (_, i) => {
      const z = -18 + (i / count) * 40 + (rand() - 0.5) * 1.2;
      const side = i % 2 ? 1 : -1;
      const x = riverX(z) + side * (3.8 + rand() * 1.8);
      const y = heightAt(x, z);
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((rand() - 0.5) * 0.25, rand() * 6.28, (rand() - 0.5) * 0.25));
      m.compose(
        new THREE.Vector3(x, y, z),
        q,
        new THREE.Vector3(1, 0.8 + rand() * 1.0, 1)
      );
      return m;
    });
  }, [count, seed]);

  useEffect(() => {
    if (!ref.current) return;
    matrices.forEach((m, i) => ref.current.setMatrixAt(i, m));
    ref.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  return (
    <instancedMesh
      ref={ref}
      args={[geo, material, matrices.length]}
      frustumCulled={false}
    />
  );
}

export default function Landmarks() {
  return (
    <group>
      <StaticBatch name="landmarks">
        <Venue />
        <WaterPark />
        <FallsViewpoint />
        <Bridge z={4} />
      </StaticBatch>
      <Palm x={11} z={18.5} scale={1.3} lean={0.7} hue={0.4} />
      <Palm x={21.5} z={15.5} scale={1.4} lean={-0.5} hue={1.2} />
      <Palm x={11.5} z={4.0} scale={1.0} lean={0.4} hue={2.0} />
      <Palm x={22.5} z={5.0} scale={1.35} lean={-0.7} hue={0.9} />
      <Palm x={-3.0} z={15.0} scale={1.1} lean={0.5} hue={1.7} />
      <Reeds />
    </group>
  );
}
