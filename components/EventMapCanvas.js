"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { buildTerrainGeometry } from "@/lib/lowpoly";
import { startGlobalClock, timeUniform } from "@/lib/shaders";
import { scrollState } from "@/lib/scrollState";
import { useIsMobile, usePrefersReducedMotion } from "@/lib/hooks";
import { LOCATIONS, heightAt, locationY } from "@/lib/world";
import Forest from "./Forest";
import Waterfall from "./Waterfall";
import CableCar from "./CableCar";
import Landmarks from "./Landmarks";
import { Box } from "./primitives";

const BG = "#d3e9f1";
const AREA = { x0: -42, x1: 42, z0: -42, z1: 24 };
const GRID = { segW: 56, segD: 44 };
const DEFAULT_TARGET = [0, 6, -8]; // module constant: a fresh array each render would reset the controls

// Walls around the island so it reads as a floating diorama, not a cut-out.
function buildSkirt({ x0, x1, z0, z1, segX, segZ, bottom, heightFn }) {
  const edges = [
    [x0, z0, x1, z0, segX],
    [x1, z0, x1, z1, segZ],
    [x1, z1, x0, z1, segX],
    [x0, z1, x0, z0, segZ],
  ];
  const pos = [];
  for (const [ax, az, bx, bz, seg] of edges) {
    for (let i = 0; i < seg; i++) {
      const t0 = i / seg;
      const t1 = (i + 1) / seg;
      const ax0 = ax + (bx - ax) * t0;
      const az0 = az + (bz - az) * t0;
      const ax1 = ax + (bx - ax) * t1;
      const az1 = az + (bz - az) * t1;
      const h0 = heightFn(ax0, az0);
      const h1 = heightFn(ax1, az1);
      pos.push(ax0, h0, az0, ax0, bottom, az0, ax1, h1, az1);
      pos.push(ax1, h1, az1, ax0, bottom, az0, ax1, bottom, az1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function MapTerrain() {
  const { terrain, skirt, terrainMat, skirtMat } = useMemo(() => {
    const width = AREA.x1 - AREA.x0;
    const depth = AREA.z1 - AREA.z0;
    return {
      terrain: buildTerrainGeometry({
        width,
        depth,
        centerX: (AREA.x0 + AREA.x1) / 2,
        centerZ: (AREA.z0 + AREA.z1) / 2,
        ...GRID,
        heightFn: heightAt,
        seed: 7,
      }),
      skirt: buildSkirt({
        ...AREA,
        segX: GRID.segW,
        segZ: GRID.segD,
        bottom: -7,
        heightFn: heightAt,
      }),
      terrainMat: new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
        roughness: 1,
      }),
      skirtMat: new THREE.MeshStandardMaterial({
        color: "#355a45",
        flatShading: true,
        roughness: 1,
        side: THREE.DoubleSide,
      }),
    };
  }, []);

  useEffect(
    () => () => {
      terrain.dispose();
      skirt.dispose();
      terrainMat.dispose();
      skirtMat.dispose();
    },
    [terrain, skirt, terrainMat, skirtMat]
  );

  return (
    <group>
      <mesh geometry={terrain} material={terrainMat} />
      <mesh geometry={skirt} material={skirtMat} />
    </group>
  );
}

function Marker({ loc, active, onSelect }) {
  const body = useRef();
  const [hover, setHover] = useState(false);
  const baseY = useMemo(() => locationY(loc), [loc]);

  useEffect(() => {
    document.body.style.cursor = hover ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hover]);

  useFrame(() => {
    const m = body.current;
    if (!m) return;
    const t = timeUniform.value;
    m.position.y = loc.lift + Math.sin(t * 1.6 + loc.x) * 0.35;
    m.rotation.y = t * 0.8;
    const target = active ? 1.5 : hover ? 1.25 : 1;
    m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, target, 0.15));
  });

  return (
    <group position={[loc.x, baseY, loc.z]}>
      <Box size={[0.07, loc.lift, 0.07]} position={[0, loc.lift / 2, 0]} color="#0b3d2e" />
      <mesh
        ref={body}
        position={[0, loc.lift, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(active ? null : loc.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => setHover(false)}
      >
        <octahedronGeometry args={[1.15, 0]} />
        <meshStandardMaterial
          color={loc.color}
          emissive={loc.color}
          emissiveIntensity={0.35}
          flatShading
        />
      </mesh>
      <Html
        position={[0, loc.lift + 2.6, 0]}
        center
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none" }}
      >
        <span className={`map-label ${active ? "is-active" : ""}`}>{loc.short}</span>
      </Html>
    </group>
  );
}

// Eases the orbit target toward the selected pin (or back to the centre).
function FocusRig({ active }) {
  const controls = useThree((s) => s.controls);
  const gl = useThree((s) => s.gl);
  const target = useMemo(() => new THREE.Vector3(), []);
  const frames = useRef(0);

  useFrame(() => {
    // one-finger vertical swipes must still scroll the page on touch screens
    if (frames.current < 30) {
      gl.domElement.style.touchAction = "pan-y";
      frames.current++;
    }
    if (!controls) return;
    const loc = active ? LOCATIONS.find((l) => l.id === active) : null;
    if (loc) target.set(loc.x, locationY(loc) + 3, loc.z);
    else target.set(...DEFAULT_TARGET);
    controls.target.lerp(target, 0.08);
  });
  return null;
}

function Driver({ inView }) {
  const invalidate = useThree((s) => s.invalidate);
  const live = useRef(inView);
  live.current = inView;
  useEffect(() => {
    let id;
    const loop = () => {
      if (live.current && !document.hidden) invalidate();
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [invalidate]);
  return null;
}

export default function EventMapCanvas({ active, onSelect, inView }) {
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    startGlobalClock(scrollState);
  }, []);

  return (
    <Canvas
      frameloop="demand"
      flat
      dpr={mobile ? [1, 1.25] : [1, 1.6]}
      camera={{ fov: 36, near: 1, far: 500, position: [0, 62, 56] }}
      gl={{ antialias: !mobile }}
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 120, 280]} />
      <hemisphereLight args={["#e6f4ff", "#5f7a58", 1]} />
      <directionalLight position={[-40, 70, 40]} intensity={2.1} color="#fff4dc" />

      <Suspense fallback={null}>
        <MapTerrain />
        <Forest
          count={mobile ? 170 : 360}
          seed={3}
          bounds={{ x0: AREA.x0 + 1, x1: AREA.x1 - 1, z0: AREA.z0 + 1, z1: AREA.z1 - 1 }}
        />
        <Waterfall zBack={AREA.z0} zFront={AREA.z1} rows={130} />
        <Landmarks />
        <CableCar driveWithScroll={false} />
        {LOCATIONS.map((loc) => (
          <Marker key={loc.id} loc={loc} active={active === loc.id} onSelect={onSelect} />
        ))}
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={30}
        maxDistance={115}
        minPolarAngle={0.3}
        maxPolarAngle={1.3}
        autoRotate={!reduced && !active}
        autoRotateSpeed={0.35}
        target={DEFAULT_TARGET}
      />
      <FocusRig active={active} />
      <Driver inView={inView} />
    </Canvas>
  );
}
