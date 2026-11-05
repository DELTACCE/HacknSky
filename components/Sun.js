"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const POS = [39, 36, -55];

// A hard-edged cel sun with two flat halos. It always faces the camera, so it
// stays a disc instead of becoming an ellipse as the rig moves.
export default function Sun() {
  const group = useRef();

  useFrame(({ camera }) => {
    group.current?.lookAt(camera.position);
  });

  return (
    <group ref={group} position={POS} renderOrder={-2}>
      <mesh>
        <circleGeometry args={[11, 48]} />
        <meshBasicMaterial color="#ffcf8a" transparent opacity={0.16} depthWrite={false} fog={false} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[6.4, 48]} />
        <meshBasicMaterial color="#ffc276" transparent opacity={0.28} depthWrite={false} fog={false} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <circleGeometry args={[3.2, 48]} />
        <meshBasicMaterial color="#ffd08a" fog={false} />
      </mesh>
    </group>
  );
}
