"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { padHeightOf, PADS } from "@/lib/world";
import { Box, Cone, Cyl, PALETTE, mat } from "./primitives";

const pad = (id) => PADS.find((p) => p.id === id);

export function Venue() {
  const p = pad("venue");
  return (
    <group position={[p.x, padHeightOf("venue"), p.z]}>
      {/* foundation */}
      <Box size={[9.4, 0.8, 7.4]} position={[0.8, 0, 0]} color={PALETTE.stone} />
      {/* main hall */}
      <Box size={[6, 2.6, 4]} position={[0, 1.7, 0]} color={PALETTE.paper} />
      <Cone radial={4} size={[4.5, 1.7, 3.0]} position={[0, 3.85, 0]} color={PALETTE.forest} />
      <Box size={[2.4, 0.55, 0.1]} position={[0, 2.55, 2.06]} color={PALETTE.lime} />
      <Box size={[0.9, 1.5, 0.1]} position={[-1.9, 1.15, 2.03]} color={PALETTE.emerald} />
      <Box size={[1.1, 0.8, 0.1]} position={[1.5, 1.7, 2.03]} color={PALETTE.glass} />
      {/* annex */}
      <Box size={[2.4, 1.6, 2.6]} position={[4.2, 1.2, 0.4]} color={PALETTE.paper} />
      <Cone radial={4} size={[1.8, 1.0, 1.95]} position={[4.2, 2.5, 0.4]} color={PALETTE.clay} />
      {/* flag */}
      <Cyl radial={5} size={[0.06, 4.5, 0.06]} position={[-3.3, 2.65, 1.9]} color={PALETTE.ink} />
      <Box size={[1.0, 0.6, 0.05]} position={[-2.8, 4.35, 1.9]} color={PALETTE.lime} />
      {/* tents */}
      <Cone radial={6} size={[0.95, 1.2, 0.95]} position={[-4.4, 1.0, -2.8]} color={PALETTE.lime} />
      <Cone radial={6} size={[0.85, 1.1, 0.85]} position={[-3.0, 0.95, -3.7]} color={PALETTE.sky} />
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
  const water = mat(PALETTE.water, { emissive: PALETTE.water, emissiveIntensity: 0.18 });
  return (
    <group position={[p.x, padHeightOf("waterpark"), p.z]}>
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

export default function Landmarks() {
  return (
    <group>
      <Venue />
      <WaterPark />
      <FallsViewpoint />
    </group>
  );
}
