"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { mulberry32 } from "@/lib/noise";
import { timeUniform } from "@/lib/shaders";

const BIRD_COLOR = "#183b2c";

function Bird({ phase, radius, height, speed, size, tilt }) {
  const group = useRef();
  const left = useRef();
  const right = useRef();

  useFrame(() => {
    const t = timeUniform.value * speed + phase;
    if (group.current) {
      group.current.position.set(
        Math.cos(t) * radius,
        height + Math.sin(t * 1.7 + phase) * 1.4,
        -42 + Math.sin(t) * radius * 0.55
      );
      group.current.rotation.y = -t + Math.PI / 2;
      group.current.rotation.z = tilt;
    }
    const flap = Math.sin(timeUniform.value * 5.2 + phase * 9) * 0.55;
    if (left.current) left.current.rotation.z = flap;
    if (right.current) right.current.rotation.z = -flap;
  });

  return (
    <group ref={group} scale={size}>
      <mesh>
        <coneGeometry args={[0.09, 0.55, 4]} />
        <meshBasicMaterial color={BIRD_COLOR} />
      </mesh>
      <group ref={left}>
        <mesh position={[-0.42, 0, 0]} rotation={[0, 0, 0.18]} scale={[0.9, 0.045, 0.28]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={BIRD_COLOR} />
        </mesh>
      </group>
      <group ref={right}>
        <mesh position={[0.42, 0, 0]} rotation={[0, 0, -0.18]} scale={[0.9, 0.045, 0.28]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={BIRD_COLOR} />
        </mesh>
      </group>
    </group>
  );
}

export default function Birds({ count = 8, seed = 17 }) {
  const birds = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      phase: rand() * Math.PI * 2,
      radius: 22 + rand() * 26,
      height: 22 + rand() * 13,
      speed: 0.045 + rand() * 0.045,
      size: 0.7 + rand() * 0.8,
      tilt: (rand() - 0.5) * 0.4,
      key: i,
    }));
  }, [count, seed]);

  return (
    <group>
      {birds.map(({ key, ...b }) => (
        <Bird key={key} {...b} />
      ))}
    </group>
  );
}
