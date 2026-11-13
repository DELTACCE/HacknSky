import * as THREE from "three";
import { cablePoint, carT } from "./world";
import { SCENE_STAGES } from "./scrollState";

// Camera path: one keyframe per scene section.
//   0 hero · 1 destination · 2 cable car · 3 registration
export const KEYS = [
  { pos: [3, 17, 47], tgt: [0, 11, -12] },
  { pos: [10, 14.5, 20], tgt: [-2, 13, -26] },
  { pos: [-3, 12, 10], tgt: [6, 10, -2] },
  { pos: [0, 28, 54], tgt: [0, 9, -18] },
];

const v3 = (a) => new THREE.Vector3(...a);
const curves = {
  pos: new THREE.CatmullRomCurve3(KEYS.map((k) => v3(k.pos))),
  tgt: new THREE.CatmullRomCurve3(KEYS.map((k) => v3(k.tgt))),
};

// The camera pose the Rig in HeroScene produces at a given scroll stage
// (0..3), minus the pointer parallax. Used to anchor 3D captions in the world
// where the camera will be looking when the reader reaches them.
export function cameraPose(stage, { portrait = false, time = 0 } = {}) {
  stage = THREE.MathUtils.clamp(stage, 0, SCENE_STAGES);
  let cs = stage;
  if (stage > 2) {
    cs = stage < 2.7 ? 2 + (0.2 * (stage - 2)) / 0.7 : 2.2 + (0.8 * (stage - 2.7)) / 0.3;
  }
  const t = cs / SCENE_STAGES;
  const pos = curves.pos.getPoint(t, new THREE.Vector3());
  const tgt = curves.tgt.getPoint(t, new THREE.Vector3());

  const w =
    THREE.MathUtils.smoothstep(stage, 1.3, 1.9) *
    (1 - THREE.MathUtils.smoothstep(stage, 2.3, 2.8));
  if (w > 0.001) {
    const car = cablePoint(carT(stage / SCENE_STAGES, time), 0, new THREE.Vector3());
    car.y -= 2.6;
    tgt.lerp(car, w);
  }
  if (portrait) pos.sub(tgt).multiplyScalar(1.3).add(tgt);
  return { pos, tgt, fov: portrait ? 58 : 45 };
}
