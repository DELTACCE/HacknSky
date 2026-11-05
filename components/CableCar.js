"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CABLE, CABLE_Z, LANE_GAP, cablePoint, carT } from "@/lib/world";
import { scrollState } from "@/lib/scrollState";
import { timeUniform } from "@/lib/shaders";
import { Box, Cone, Cyl, PALETTE } from "./primitives";

// ---------------------------------------------------------------------------
// The cabin. Origin = the grip on the cable; the cabin hangs below it.
// ---------------------------------------------------------------------------
export function Gondola({ scale = 1 }) {
  return (
    <group scale={scale}>
      {/* grip + hanger */}
      <Box size={[0.9, 0.28, 0.42]} position={[0, 0, 0]} color={PALETTE.ink} />
      <Box size={[0.14, 1.5, 0.14]} position={[0, -0.85, 0]} color={PALETTE.ink} />
      {/* roof */}
      <Cone radial={4} size={[1.75, 0.6, 1.25]} position={[0, -1.82, 0]} color={PALETTE.lime} />
      {/* body */}
      <Box size={[2.1, 1.25, 1.35]} position={[0, -2.78, 0]} color={PALETTE.paper} />
      {/* lime belt */}
      <Box size={[2.14, 0.12, 1.39]} position={[0, -3.28, 0]} color={PALETTE.lime} />
      {/* floor */}
      <Box size={[2.2, 0.14, 1.45]} position={[0, -3.45, 0]} color={PALETTE.emerald} />
      {/* windows: front/back */}
      {[1, -1].map((s) => (
        <group key={s}>
          <Box size={[0.7, 0.55, 0.06]} position={[-0.52, -2.72, s * 0.69]} color={PALETTE.glass} />
          <Box size={[0.7, 0.55, 0.06]} position={[0.52, -2.72, s * 0.69]} color={PALETTE.glass} />
          <Box size={[0.06, 0.55, 0.8]} position={[s * 1.07, -2.72, 0]} color={PALETTE.glass} />
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Stations
// ---------------------------------------------------------------------------
function Station({ x, y, z, outward }) {
  const topY = CABLE.a.y - CABLE.groundA; // pylon height above the pad
  return (
    <group position={[x, y, z]}>
      {/* platform */}
      <Box size={[5.4, 0.6, 5.4]} position={[outward * 2.4, 0, 0]} color={PALETTE.stone} />
      {/* hut */}
      <Box size={[3.2, 2.2, 3.8]} position={[outward * 3.2, 1.4, 0]} color={PALETTE.paper} />
      <Cone radial={4} size={[3.0, 1.1, 3.4]} position={[outward * 3.2, 3.05, 0]} color={PALETTE.emerald} />
      <Box size={[0.9, 1.3, 0.1]} position={[outward * 3.2, 1.05, 1.93]} color={PALETTE.lime} />
      {/* pylon + crossbeam holding both lanes */}
      <Box size={[0.5, topY, 0.5]} position={[0, topY / 2, 0]} color={PALETTE.sage} />
      <Box size={[0.4, 0.3, LANE_GAP + 1.4]} position={[0, topY + 0.1, 0]} color={PALETTE.ink} />
      {/* sheave wheels */}
      <Cyl radial={8} size={[0.32, 0.12, 0.32]} rotation={[Math.PI / 2, 0, 0]} position={[0, topY - 0.12, LANE_GAP / 2]} color={PALETTE.ink} />
      <Cyl radial={8} size={[0.32, 0.12, 0.32]} rotation={[Math.PI / 2, 0, 0]} position={[0, topY - 0.12, -LANE_GAP / 2]} color={PALETTE.ink} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Two cables, two stations, two cabins travelling in opposite directions.
// `driveWithScroll`: lane 0 follows page scroll progress (hero behaviour).
// ---------------------------------------------------------------------------
const cableMat = new THREE.MeshStandardMaterial({
  color: "#26332d",
  roughness: 1,
  flatShading: true,
});

function buildCableGeometry(lane) {
  const pts = [];
  for (let i = 0; i <= 40; i++) pts.push(cablePoint(i / 40, lane).clone());
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.07, 4, false);
}

export default function CableCar({
  carScale = 1.15,
  driveWithScroll = true,
  idleSpeed = 0.035, // used when not scroll-driven (map)
}) {
  const car0 = useRef();
  const car1 = useRef();
  const swing0 = useRef();
  const swing1 = useRef();
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const geometries = useMemo(() => [buildCableGeometry(0), buildCableGeometry(1)], []);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);

  const zMid = CABLE_Z - LANE_GAP / 2;

  useFrame(() => {
    const time = timeUniform.value;
    let t0;
    if (driveWithScroll) {
      t0 = carT(scrollState.smooth, time);
    } else {
      // ping-pong along the cable
      const ph = (time * idleSpeed) % 2;
      t0 = 0.06 + 0.88 * (ph < 1 ? ph : 2 - ph);
    }
    const t1 = 1 - t0;

    if (car0.current) car0.current.position.copy(cablePoint(t0, 0, tmp));
    if (car1.current) car1.current.position.copy(cablePoint(t1, 1, tmp));
    if (swing0.current) swing0.current.rotation.z = Math.sin(time * 1.2) * 0.035;
    if (swing1.current) swing1.current.rotation.z = Math.sin(time * 1.1 + 2) * 0.035;
  });

  return (
    <group>
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g} material={cableMat} />
      ))}

      <Station x={CABLE.a.x} y={CABLE.groundA} z={zMid} outward={-1} />
      <Station x={CABLE.b.x} y={CABLE.groundB} z={zMid} outward={1} />

      <group ref={car0}>
        <group ref={swing0}>
          <Gondola scale={carScale} />
        </group>
      </group>
      <group ref={car1}>
        <group ref={swing1}>
          <Gondola scale={carScale} />
        </group>
      </group>
    </group>
  );
}
