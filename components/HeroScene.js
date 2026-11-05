"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState, SCENE_STAGES } from "@/lib/scrollState";
import { cablePoint, carT } from "@/lib/world";
import { startGlobalClock, timeUniform } from "@/lib/shaders";
import { useIsMobile } from "@/lib/hooks";
import LowPolyEnvironment from "./LowPolyEnvironment";

// Camera path: one keyframe per scene section.
//   0 hero · 1 destination · 2 cable car · 3 registration
const KEYS = [
  { pos: [3, 17, 47], tgt: [0, 11, -12] },
  { pos: [10, 14.5, 20], tgt: [-2, 13, -26] },
  { pos: [-3, 12, 10], tgt: [6, 10, -2] },
  { pos: [0, 28, 54], tgt: [0, 9, -18] },
];

const v3 = (a) => new THREE.Vector3(...a);

function Rig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const curves = useMemo(
    () => ({
      pos: new THREE.CatmullRomCurve3(KEYS.map((k) => v3(k.pos))),
      tgt: new THREE.CatmullRomCurve3(KEYS.map((k) => v3(k.tgt))),
    }),
    []
  );
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      tgt: new THREE.Vector3(),
      car: new THREE.Vector3(),
      look: new THREE.Vector3(),
      px: 0,
      py: 0,
    }),
    []
  );
  const fovRef = useRef(0);

  useFrame((_, dt) => {
    const s = scrollState;
    const d = Math.min(dt, 0.1);
    s.smooth = s.reduced
      ? s.progress
      : THREE.MathUtils.damp(s.smooth, s.progress, 3.5, d);

    // camera stage: hold near keyframe 2 while the pinned cable-car section
    // scrolls (stage 2 -> 2.7), then fly on to the finale while hidden
    const stage = THREE.MathUtils.clamp(s.smooth, 0, 1) * SCENE_STAGES;
    let cs = stage;
    if (stage > 2) {
      cs = stage < 2.7 ? 2 + (0.2 * (stage - 2)) / 0.7 : 2.2 + (0.8 * (stage - 2.7)) / 0.3;
    }
    s.dusk = THREE.MathUtils.smoothstep(cs, 2.35, 3);
    const t = cs / SCENE_STAGES;
    curves.pos.getPoint(t, tmp.pos);
    curves.tgt.getPoint(t, tmp.tgt);

    // while the cable-car section is on screen, look at the moving cabin
    const w =
      THREE.MathUtils.smoothstep(stage, 1.3, 1.9) *
      (1 - THREE.MathUtils.smoothstep(stage, 2.3, 2.8));
    if (w > 0.001) {
      cablePoint(carT(s.smooth, timeUniform.value), 0, tmp.car);
      tmp.car.y -= 2.6;
      tmp.tgt.lerp(tmp.car, w);
    }

    // portrait screens: wider lens and a camera pulled back
    const portrait = size.width / size.height < 0.9;
    const fov = portrait ? 58 : 45;
    if (fovRef.current !== fov) {
      fovRef.current = fov;
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    if (portrait) tmp.pos.sub(tmp.tgt).multiplyScalar(1.3).add(tmp.tgt);

    // gentle pointer parallax
    if (!s.reduced) {
      tmp.px = THREE.MathUtils.damp(tmp.px, s.pointer.x, 2.5, d);
      tmp.py = THREE.MathUtils.damp(tmp.py, s.pointer.y, 2.5, d);
      tmp.pos.x += tmp.px * 1.8;
      tmp.pos.y += tmp.py * 0.9;
    }

    camera.position.copy(tmp.pos);
    tmp.look.copy(tmp.tgt);
    camera.lookAt(tmp.look);
  });

  return null;
}

// frameloop="demand" + our own rAF: renders only while the canvas is visible.
function Driver() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let id;
    let warm = 4;
    let last = -1;
    const loop = () => {
      const s = scrollState;
      if (s.active && !document.hidden) {
        const moved = Math.abs(s.progress - last) > 1e-4 || Math.abs(s.progress - s.smooth) > 1e-4;
        if (!s.reduced || moved || warm > 0) invalidate();
        last = s.progress;
        if (warm > 0) warm--;
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [invalidate]);
  return null;
}

export default function HeroScene() {
  const mobile = useIsMobile();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    startGlobalClock(scrollState);
  }, []);

  return (
    <Canvas
      className="scene-canvas"
      style={{ opacity: shown ? 1 : 0 }}
      frameloop="demand"
      flat
      dpr={mobile ? [1, 1.25] : [1, 1.6]}
      camera={{ fov: 45, near: 0.5, far: 800, position: KEYS[0].pos }}
      gl={{ antialias: !mobile, powerPreference: "high-performance" }}
      onCreated={() => setShown(true)}
    >
      <Suspense fallback={null}>
        <LowPolyEnvironment quality={mobile ? 0.55 : 1} />
      </Suspense>
      <Rig />
      <Driver />
    </Canvas>
  );
}
