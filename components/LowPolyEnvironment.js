"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildTerrainGeometry } from "@/lib/lowpoly";
import { createSkyMaterial, FOG_COLOR } from "@/lib/shaders";
import { outlineMaterial, toonVertexColors } from "@/lib/toon";
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
import Flowers from "./Flowers";
import GodRays from "./GodRays";
import Mist from "./Mist";
import Fireflies from "./Fireflies";
import CampfireSparks from "./CampfireSparks";

const DAY_HORIZON = new THREE.Color("#f4d5b3");
const DAY_TOP = new THREE.Color("#8dc3dc");
const DUSK_HORIZON = new THREE.Color("#f0b78e");
const DUSK_TOP = new THREE.Color("#6f8fae");
const DAY_SUN = new THREE.Color("#ffd7a0");
const DUSK_SUN = new THREE.Color("#ffb277");

// Everything that makes up the hero world, plus lighting, fog and sky.
// The sky/fog/sun warm up as the page nears the registration section.
function ShadowCaster({ children }) {
  const ref = useRef();
  useEffect(() => {
    ref.current?.traverse((o) => {
      if (o.isMesh && o.material !== outlineMaterial) o.castShadow = true;
    });
  }, []);
  return <group ref={ref}>{children}</group>;
}

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
  const terrainMat = useMemo(() => {
    const m = toonVertexColors();
    // A soft paper-grain variation across the hills, so large slopes do not
    // read as a single flat swatch.
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vPaperPos;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvPaperPos = (modelMatrix * vec4(transformed, 1.0)).xyz;"
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          varying vec3 vPaperPos;
          float pnoise(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
            float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
            float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
            float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
          }`
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float grain = pnoise(vPaperPos.xz * 0.24) * 0.62 + pnoise(vPaperPos.xz * 0.85) * 0.38;
          diffuseColor.rgb *= 0.93 + grain * 0.11;`
        );
    };
    m.needsUpdate = true;
    return m;
  }, []);
  const sky = useMemo(() => createSkyMaterial(), []);

  useEffect(() => {
    scene.fog = new THREE.FogExp2(FOG_COLOR, 0.0072);
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
    if (scene.fog) {
      scene.fog.color.copy(tmp.copy(DAY_HORIZON).lerp(DUSK_HORIZON, k)).lerp(new THREE.Color(FOG_COLOR), 0.6);
      scene.fog.density = THREE.MathUtils.lerp(0.0068, 0.009, k);
    }
    if (sunRef.current) {
      sunRef.current.color.copy(DAY_SUN).lerp(DUSK_SUN, k);
      sunRef.current.intensity = THREE.MathUtils.lerp(2.05, 1.65, k);
    }
    if (hemiRef.current) hemiRef.current.intensity = THREE.MathUtils.lerp(0.88, 0.68, k);
  });

  return (
    <>
      <hemisphereLight ref={hemiRef} args={["#c3dbe6", "#6b573f", 0.88]} />
      <directionalLight
        ref={sunRef}
        position={[44, 62, -16]}
        intensity={2.05}
        color="#ffd7a0"
        castShadow={quality >= 1}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={38}
        shadow-camera-bottom={-38}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-bias={-0.0006}
      />
      <directionalLight position={[-32, 24, 24]} intensity={0.5} color="#9fc4d8" />
      <directionalLight position={[-6, 18, -44]} intensity={0.35} color="#ffb47a" />

      <mesh material={sky} scale={420} renderOrder={-1}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>

      <Backdrop />
      <Sun />
      <mesh geometry={terrain} material={terrainMat} receiveShadow />
      <Mountain />
      <Forest count={Math.round(900 * quality)} seed={3} />
      <Waterfall />
      <Undergrowth count={Math.round(180 * quality)} />
      <Flowers count={Math.round(90 * quality)} />
      <ShadowCaster>
        <Landmarks />
        <CableCar driveWithScroll />
      </ShadowCaster>
      <GodRays />
      <Mist />
      <Fireflies count={quality < 1 ? 24 : 48} />
      <CampfireSparks />
      <Clouds count={quality < 1 ? 6 : 11} />
      <Birds count={quality < 1 ? 4 : 9} />
    </>
  );
}
