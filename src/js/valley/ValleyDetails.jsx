import { Component, useLayoutEffect } from "react";
import { createRoot, extend } from "@react-three/fiber";
import {
  BoxGeometry, CylinderGeometry, Group, IcosahedronGeometry, InstancedMesh,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, MeshToonMaterial, RingGeometry, ShaderMaterial,
} from "three";
import { Falls } from "./Falls.jsx";
import { Gondola } from "./Gondola.jsx";

extend({
  BoxGeometry, CylinderGeometry, Group, IcosahedronGeometry, InstancedMesh,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, MeshToonMaterial, RingGeometry, ShaderMaterial,
});

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { this.props.onError(error); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Landmarks({ falls, cabins, motion, onReady }) {
  useLayoutEffect(onReady, [onReady]);
  return <>
    <Falls {...falls} motion={motion} />
    {cabins.map((cabin, index) => (
      <Gondola key={index} cabin={cabin} index={index} motion={motion} />
    ))}
  </>;
}

// Use the existing canvas, camera and scene. The scroll runtime advances Fiber
// only on frames it would already draw, after moving the camera and cabins.
export async function mountValleyDetails({ canvas, renderer, scene, camera, ...props }) {
  const root = createRoot(canvas);
  try {
    await root.configure({
      gl: renderer, scene, camera, flat: true, shadows: renderer.shadowMap.enabled,
      dpr: renderer.getPixelRatio(), size: { width: innerWidth, height: innerHeight },
      frameloop: "never",
    });
    let state;
    await new Promise((resolve, reject) => {
      const store = root.render(
        <SceneBoundary onError={reject}>
          <Landmarks {...props} onReady={() => resolve()} />
        </SceneBoundary>,
      );
      state = store.getState();
    });
    canvas.dataset.valley = "ready";
    return {
      render: (seconds) => state.advance(seconds, false),
      dispose() {
        delete canvas.dataset.valley;
        root.unmount();
      },
    };
  } catch (error) {
    root.unmount();
    throw error;
  }
}
