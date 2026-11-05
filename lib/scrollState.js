// Mutable state shared between DOM (GSAP ScrollTrigger) and the WebGL scene.
// Kept outside React state on purpose: it changes every frame.
export const scrollState = {
  stage: 0, // 0..3 position along the sequence of "scene" sections
  progress: 0, // stage / 3, i.e. 0..1 across the whole journey
  smooth: 0, // eased value the 3D scene reads
  dusk: 0, // 0 day .. 1 sunset, written by the camera rig
  active: true, // false while opaque sections cover the canvas (pauses rendering)
  reduced: false, // prefers-reduced-motion
  pointer: { x: 0, y: 0 }, // -1..1 pointer for subtle parallax
};

export const SCENE_STAGES = 3; // hero -> destination -> cable car -> registration
