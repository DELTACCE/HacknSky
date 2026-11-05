"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { heightAt, padHeightOf, PADS, riverX } from "@/lib/world";
import { Box, Cone, Cyl, PALETTE, Rock, mat } from "./primitives";

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

      {/* campfire and string lights */}
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

function Palm({ x, z, scale = 1, lean = 0, hue = 0 }) {
  const base = heightAt(x, z);
  const top = 4.0;
  return (
    <group position={[x, base, z]} scale={scale}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Cyl
          key={i}
          radial={6}
          size={[0.16 - i * 0.018, 0.85, 0.16 - i * 0.018]}
          position={[lean * i * 0.09, 0.4 + i * 0.8, 0]}
          rotation={[0, 0, lean * 0.05]}
          color={i % 2 ? PALETTE.woodDark : PALETTE.wood}
        />
      ))}
      <Cyl radial={5} size={[0.2, 0.28, 0.2]} position={[lean * 0.45, top - 0.1, 0]} color={PALETTE.forest} />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2 + hue;
        const droop = -0.3 - (i % 3) * 0.08;
        return (
          <Box
            key={i}
            size={[2.5 - (i % 2) * 0.25, 0.07, 0.5]}
            position={[Math.cos(a) * 0.98 + lean * 0.45, top + 0.05, Math.sin(a) * 0.98]}
            rotation={[0, -a, droop]}
            color={i % 2 ? PALETTE.lime : PALETTE.forest}
          />
        );
      })}
      {[0, 1, 2].map((i) => {
        const a = hue + i * 2.1;
        return (
          <Rock
            key={i}
            size={[0.16, 0.17, 0.16]}
            position={[Math.cos(a) * 0.28 + lean * 0.45, top - 0.28, Math.sin(a) * 0.28]}
            color={PALETTE.woodDark}
          />
        );
      })}
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
            <Box key={pz} size={[0.12, 1.15, 0.12]} position={[x, 0.85, pz]} color={PALETTE.woodDark} />
          ))}
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
      <Venue />
      <WaterPark />
      <FallsViewpoint />
      <Bridge z={4} />
      <Palm x={11} z={18.5} scale={1.3} lean={0.7} hue={0.4} />
      <Palm x={21.5} z={15.5} scale={1.4} lean={-0.5} hue={1.2} />
      <Palm x={11.5} z={4.0} scale={1.0} lean={0.4} hue={2.0} />
      <Palm x={22.5} z={5.0} scale={1.35} lean={-0.7} hue={0.9} />
      <Palm x={-3.0} z={15.0} scale={1.1} lean={0.5} hue={1.7} />
      <Reeds />
    </group>
  );
}
