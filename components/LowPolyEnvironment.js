"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildTerrainGeometry } from "@/lib/lowpoly";
import { createSkyMaterial, FOG_COLOR } from "@/lib/shaders";
import { toonVertexColors } from "@/lib/toon";
import { scrollState } from "@/lib/scrollState";
import { heightAt, TERRAIN } from "@/lib/world";
import Mountain from "./Mountain";
import Forest from "./Forest";
import Waterfall from "./Waterfall";
import Clouds from "./Clouds";
import CableCar from "./CableCar";
import Landmarks from "./Landmarks";
import Backdrop from "./Backdrop";
import Birds from "./Birds";
import Sun from "./Sun";
import Undergrowth from "./Undergrowth";

const DAY_HORIZON = new THREE.Color("#f4f5dc");
const DAY_TOP = new THREE.Color("#79c7e8");
const DUSK_HORIZON = new THREE.Color("#f9dcb2");
const DUSK_TOP = new THREE.Color("#7fb4d6");
const DAY_SUN = new THREE.Color("#fff4dc");
const DUSK_SUN = new THREE.Color("#ffc890");

// Everything that makes up the hero world, plus lighting, fog and sky.
// The sky/fog/sun warm up as the page nears the registration section.
export default function LowPolyEnvironment({ quality = 1 }) {
  const scene = useThree((s) => s.scene);
  const sunRef = useRef();
  const hemiRef = useRef();

  const terrain = useMemo(
    () =>
      buildTerrainGeometry({
        ...TERRAIN,
        heightFn: heightAt,
        seed: 7,
      }),
    []
  );
  const terrainMat = useMemo(() => toonVertexColors(), []);
  const sky = useMemo(() => createSkyMaterial(), []);

  useEffect(() => {
    scene.fog = new THREE.Fog(FOG_COLOR, 55, 200);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useEffect(
    () => () => {
      terrain.dispose();
      sky.dispose();
    },
    [terrain, sky]
  );

  const tmp = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    // dusk factor: 0 until the cable-car section ends, 1 at registration
    const k = scrollState.dusk;
    sky.uniforms.uHorizon.value.copy(DAY_HORIZON).lerp(DUSK_HORIZON, k);
    sky.uniforms.uTop.value.copy(DAY_TOP).lerp(DUSK_TOP, k);
    if (scene.fog) scene.fog.color.copy(tmp.copy(DAY_HORIZON).lerp(DUSK_HORIZON, k)).multiplyScalar(0.985);
    if (sunRef.current) sunRef.current.color.copy(DAY_SUN).lerp(DUSK_SUN, k);
    if (hemiRef.current) hemiRef.current.intensity = THREE.MathUtils.lerp(0.95, 0.8, k);
  });

  return (
    <>
      <hemisphereLight ref={hemiRef} args={["#e6f4ff", "#5f7a58", 0.75]} />
      <directionalLight ref={sunRef} position={[-45, 70, 40]} intensity={2.3} color="#fff4dc" />
      <directionalLight position={[38, 26, -22]} intensity={0.55} color="#a9d9ea" />

      <mesh material={sky} scale={420} renderOrder={-1}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>

      <Backdrop />
      <Sun />
      <mesh geometry={terrain} material={terrainMat} />
      <Mountain />
      <Forest count={Math.round(900 * quality)} seed={3} />
      <Waterfall />
      <Landmarks />
      <CableCar driveWithScroll />
      <Clouds count={quality < 1 ? 6 : 11} />
      <Birds count={quality < 1 ? 4 : 9} />
    </>
  );
}
