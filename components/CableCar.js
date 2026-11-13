"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CABLE, CABLE_Z, LANE_GAP, cablePoint, carT } from "@/lib/world";
import { scrollState } from "@/lib/scrollState";
import { timeUniform } from "@/lib/shaders";
import { gradientMap } from "@/lib/toon";
import { Box, Cone, Cyl, PALETTE } from "./primitives";

// ---------------------------------------------------------------------------
// The cabin. Origin = the grip on the cable; the cabin hangs below it.
// ---------------------------------------------------------------------------
export function Gondola({ scale = 1 }) {
  return (
    <group scale={scale}>
      {/* grip and A-frame hanger */}
      <Box size={[1.12, 0.22, 0.5]} position={[0, 0, 0]} color={PALETTE.ink} />
      <Cyl radial={6} size={[0.16, 0.42, 0.16]} position={[0, 0.2, 0]} color={PALETTE.stone} />
      <Box size={[0.14, 1.15, 0.14]} position={[0, -0.72, 0]} color={PALETTE.ink} />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          size={[0.11, 1.42, 0.11]}
          position={[s * 0.63, -1.08, 0]}
          rotation={[0, 0, s * 0.42]}
          color={PALETTE.ink}
        />
      ))}
      <Box size={[1.42, 0.12, 0.16]} position={[0, -1.68, 0]} color={PALETTE.ink} />

      {/* roof: overhanging eave, lime crown, vent */}
      <Box size={[2.36, 0.12, 1.62]} position={[0, -1.76, 0]} color={PALETTE.emerald} />
      <Cone radial={4} size={[1.96, 0.56, 1.35]} position={[0, -2.02, 0]} color={PALETTE.lime} />
      <Box size={[0.44, 0.16, 0.44]} position={[0, -1.61, 0]} color={PALETTE.ink} />

      {/* body and belt */}
      <Box size={[2.14, 1.32, 1.38]} position={[0, -2.86, 0]} color={PALETTE.paper} />
      <Box size={[2.18, 0.13, 1.42]} position={[0, -3.4, 0]} color={PALETTE.lime} />
      <Box size={[2.24, 0.14, 1.48]} position={[0, -3.55, 0]} color={PALETTE.emerald} />

      {/* framed windows on the long sides */}
      {[1, -1].map((s) => (
        <group key={s}>
          <Box size={[1.7, 0.82, 0.05]} position={[0, -2.8, s * 0.7]} color={PALETTE.ink} />
          <Box size={[0.76, 0.62, 0.06]} position={[-0.45, -2.8, s * 0.715]} color={PALETTE.glass} matProps={{ emissive: PALETTE.glass, emissiveIntensity: 0.18 }} />
          <Box size={[0.76, 0.62, 0.06]} position={[0.45, -2.8, s * 0.715]} color={PALETTE.glass} matProps={{ emissive: PALETTE.glass, emissiveIntensity: 0.18 }} />
          <Box size={[0.03, 0.62, 0.02]} position={[0, -2.8, s * 0.725]} color={PALETTE.ink} />
        </group>
      ))}

      {/* doors and windows at the ends */}
      {[1, -1].map((s) => (
        <group key={s}>
          <Box size={[0.05, 0.92, 0.92]} position={[s * 1.09, -2.82, 0]} color={PALETTE.ink} />
          <Box size={[0.06, 0.74, 0.36]} position={[s * 1.1, -2.8, -0.24]} color={PALETTE.glass} matProps={{ emissive: PALETTE.glass, emissiveIntensity: 0.18 }} />
          <Box size={[0.06, 0.74, 0.36]} position={[s * 1.1, -2.8, 0.24]} color={PALETTE.glass} matProps={{ emissive: PALETTE.glass, emissiveIntensity: 0.18 }} />
        </group>
      ))}

      {/* headlights, tail lights, route plate, bumper */}
      {[-0.68, 0.68].map((x) => (
        <Box key={x} size={[0.22, 0.13, 0.06]} position={[x, -3.16, 0.71]} color={PALETTE.glow} matProps={{ emissive: PALETTE.glow, emissiveIntensity: 0.7 }} />
      ))}
      <Box size={[0.7, 0.16, 0.03]} position={[0, -2.42, 0.71]} color={PALETTE.emerald} />
      <Box size={[0.5, 0.08, 0.02]} position={[0, -2.42, 0.725]} color={PALETTE.lime} />
      <Box size={[1.9, 0.12, 1.1]} position={[0, -3.64, 0]} color={PALETTE.ink} />
      <Cyl radial={6} size={[0.12, 0.28, 0.12]} rotation={[Math.PI / 2, 0, 0]} position={[-0.55, -3.72, 0]} color={PALETTE.ink} />
      <Cyl radial={6} size={[0.12, 0.28, 0.12]} rotation={[Math.PI / 2, 0, 0]} position={[0.55, -3.72, 0]} color={PALETTE.ink} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Stations
// ---------------------------------------------------------------------------
function Station({ x, y, z, outward }) {
  const topY = CABLE.a.y - CABLE.groundA; // pylon height above the pad
  const hutX = outward * 3.2;
  return (
    <group position={[x, y, z]}>
      {/* platform and edge stripe */}
      <Box size={[5.8, 0.6, 5.6]} position={[outward * 2.4, 0, 0]} color={PALETTE.stone} />
      <Box size={[5.8, 0.06, 0.16]} position={[outward * 2.4, 0.33, 2.72]} color={PALETTE.lime} />

      {/* hut */}
      <Box size={[3.2, 2.2, 3.8]} position={[hutX, 1.4, 0]} color={PALETTE.paper} />
      <Box size={[3.8, 0.14, 4.4]} position={[hutX, 2.52, 0]} color={PALETTE.woodDark} />
      <Box size={[3.55, 0.12, 4.14]} position={[hutX, 2.58, 0]} color={PALETTE.clay} />
      <Cone radial={4} size={[2.75, 1.15, 3.15]} position={[hutX, 3.12, 0]} color={PALETTE.clay} />
      <Cone radial={4} size={[2.35, 0.1, 2.7]} position={[hutX, 3.68, 0]} color="#a34f36" />
      <Box size={[0.16, 0.14, 2.5]} position={[hutX, 3.78, 0]} color={PALETTE.woodDark} />
      <Box size={[0.9, 1.3, 0.1]} position={[hutX, 1.05, 1.93]} color={PALETTE.lime} />
      <Box size={[0.06, 0.9, 0.7]} position={[hutX + outward * 1.63, 1.35, -0.6]} color={PALETTE.glass} />
      <Box size={[0.08, 0.9, 0.7]} position={[hutX - outward * 1.63, 1.35, -0.6]} color={PALETTE.glass} />
      {/* roof supports */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <Box
            key={`${sx}${sz}`}
            size={[0.1, 1.3, 0.1]}
            position={[hutX + sx * 1.55, 1.95, sz * 1.85]}
            color={PALETTE.woodDark}
          />
        ))
      )}

      {/* hanging station sign with abstract lettering */}
      <Box size={[2.5, 0.55, 0.1]} position={[outward * 2.4, 2.35, 2.3]} color={PALETTE.emerald} />
      {[-0.78, -0.35, 0.08, 0.55].map((dx, i) => (
        <Box key={i} size={[0.22, 0.12, 0.03]} position={[outward * 2.4 + dx, 2.35, 2.36]} color={PALETTE.lime} />
      ))}

      {/* platform railing */}
      {[-2.55, 2.55].map((rx) => (
        <group key={rx}>
          {[-2.0, -0.7, 0.7, 2.0].map((rz) => (
            <Box key={rz} size={[0.08, 0.8, 0.08]} position={[outward * 2.4 + rx, 0.7, rz]} color={PALETTE.woodDark} />
          ))}
          <Box size={[0.08, 0.08, 4.1]} position={[outward * 2.4 + rx, 1.05, 0]} color={PALETTE.woodDark} />
        </group>
      ))}

      {/* steps down to the pad */}
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          size={[2.2, 0.18, 0.6]}
          position={[outward * 2.4, 0.24 - i * 0.16, 2.9 + i * 0.55]}
          color={PALETTE.stone}
        />
      ))}

      {/* pylon, crossbeam and sheaves */}
      <Box size={[0.5, topY, 0.5]} position={[0, topY / 2, 0]} color={PALETTE.sage} />
      <Box size={[0.4, 0.3, LANE_GAP + 1.4]} position={[0, topY + 0.1, 0]} color={PALETTE.ink} />
      <Box size={[0.9, 0.22, 0.22]} position={[0, topY - 0.45, 0]} color={PALETTE.ink} />
      <Cyl radial={8} size={[0.32, 0.12, 0.32]} rotation={[Math.PI / 2, 0, 0]} position={[0, topY - 0.12, LANE_GAP / 2]} color={PALETTE.ink} />
      <Cyl radial={8} size={[0.32, 0.12, 0.32]} rotation={[Math.PI / 2, 0, 0]} position={[0, topY - 0.12, -LANE_GAP / 2]} color={PALETTE.ink} />

      {/* lanterns on the platform */}
      {[-2.2, 2.2].map((dx) => (
        <group key={dx} position={[hutX + dx, 2.18, 1.9]}>
          <Box size={[0.035, 0.24, 0.035]} position={[0, 0.12, 0]} color={PALETTE.ink} />
          <Box size={[0.16, 0.22, 0.16]} position={[0, -0.05, 0]} color={PALETTE.clay} />
          <mesh position={[0, -0.05, 0.09]}>
            <sphereGeometry args={[0.075, 6, 5]} />
            <meshBasicMaterial color={PALETTE.glow} />
          </mesh>
        </group>
      ))}

      {/* machinery and a bench under the hut */}
      <Cyl radial={10} size={[0.5, 0.22, 0.5]} rotation={[Math.PI / 2, 0, 0]} position={[outward * 1.3, 1.0, -1.5]} color={PALETTE.clay} />
      <Box size={[1.1, 0.12, 0.4]} position={[hutX, 0.62, -2.0]} color={PALETTE.wood} />
      <Box size={[1.1, 0.5, 0.08]} position={[hutX, 0.85, -2.2]} color={PALETTE.woodDark} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Two cables, two stations, two cabins travelling in opposite directions.
// `driveWithScroll`: lane 0 follows page scroll progress (hero behaviour).
// ---------------------------------------------------------------------------
const cableMat = new THREE.MeshToonMaterial({
  color: "#26332d",
  gradientMap,
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
