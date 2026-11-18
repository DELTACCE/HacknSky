import { useLayoutEffect, useMemo, useRef } from "react";
import { createPortal, useFrame } from "@react-three/fiber";
import { BoxGeometry, Color, CylinderGeometry, Float32BufferAttribute, Object3D, TorusGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const INK = "#213a33", BRASS = "#d2a664", CREAM = "#f4dbab", RED = "#c4442a", TEAL = "#317d70";
const PI = Math.PI;

function Parts({ parts, kind }) {
  const mesh = useRef();
  useLayoutEffect(() => {
    const part = new Object3D();
    const color = new Color();
    parts.forEach(([position, scale, rotation, hex], i) => {
      part.position.fromArray(position);
      part.scale.fromArray(scale);
      part.rotation.set(...rotation);
      part.updateMatrix();
      mesh.current.setMatrixAt(i, part.matrix);
      mesh.current.setColorAt(i, color.set(hex));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.instanceColor.needsUpdate = true;
  }, [parts]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, parts.length]}>
    {kind === "rivets" ? <cylinderGeometry args={[.5, .5, 1, 6]} /> : <boxGeometry />}
    {kind === "lights" ? <meshBasicMaterial /> : <meshStandardMaterial roughness={.68} metalness={.14} />}
  </instancedMesh>;
}

function cabinTrim(index) {
  const panels = [], rivets = [], lights = [];
  const trim = (x, y, z, w, h, d, color, roll = 0) => panels.push([[x, y, z], [w, h, d], [0, 0, roll], color]);
  const bolt = (x, y, z, face, size = .095) => rivets.push([[x, y, z], [size, .038, size], face, BRASS]);
  for (const side of [-1, 1]) {
    const z = side * 1.385;
    // Painted lower panels, louvered vents and framed sliding doors.
    trim(0, -4.94, z, 3.45, .33, .07, TEAL);
    trim(0, -5.07, z * 1.017, 3.54, .045, .045, CREAM);
    trim(0, -3.5, z, 3.43, .075, .06, CREAM);
    for (const x of [-1.12, 1.12]) {
      trim(x, -4.92, z * 1.04, .55, .16, .035, INK);
      for (let j = -2; j <= 2; j++) trim(x + j * .09, -4.92, z * 1.062, .04, .105, .021, "#648a78", -.25);
      bolt(x * 1.4, -4.93, z * 1.043, [PI / 2, 0, 0]);
      bolt(x * 1.4, -3.37, z * 1.043, [PI / 2, 0, 0]);
    }
    for (const x of [-.21, .21]) {
      trim(x, -4.27, z * 1.045, .062, .32, .1, BRASS);
      for (const y of [-4.39, -4.16]) trim(x, y, z, .115, .055, .07, INK);
    }
    trim(0, -4.94, z * 1.052, .6, .26, .045, INK);
    // Simple raised numerals legible from both sides, without another texture.
    trim(side * -.15, -4.94, z * 1.079, .105, .156, .028, CREAM);
    trim(side * -.15, -4.94, z * 1.099, .05, .102, .028, INK);
    trim(side * .12, -4.94, z * 1.08, .038, .15, .035, CREAM);
    trim(side * .066, -4.87, z * 1.08, .11, .032, .035, CREAM);
    if (index) {
      trim(side * .12, -4.9, z * 1.09, .04, .047, .036, CREAM);
      trim(side * .066, -4.94, z * 1.08, .11, .032, .035, CREAM);
      trim(side * .066, -5, z * 1.08, .11, .032, .035, CREAM);
      trim(side * .02, -4.97, z * 1.08, .032, .065, .035, CREAM);
    }
    // Rubber buffers, edge lights and accessible grab rails on both ends.
    const x = side * 1.86;
    trim(x, -5.23, 0, .15, .15, 2.46, INK);
    for (const end of [-1, 1]) {
      trim(x, -4.95, end * .86, .19, .28, .35, INK);
      lights.push([[x + side * .106, -4.95, end * .86], [.055, .135, .22], [0, 0, 0], end === side ? CREAM : RED]);
      trim(x, -4.26, end * .82, .13, .64, .064, BRASS);
      bolt(x + side * .064, -3.34, end * 1.12, [0, 0, PI / 2]);
    }
    trim(x, -3.48, 0, .09, .08, 2.46, CREAM);
    for (const z of [-1, 1]) trim(side * 1.32, -2.48, z, .24, .31, .22, INK);
    trim(side * 1.32, -2.31, 0, .19, .13, 2.6, INK);
  }
  for (const z of [-.85, -.42, .42, .85]) trim(0, -2.23, z, 2.76, .09, .13, TEAL);
  trim(0, -1.45, .195, .15, 1.53, .09, TEAL);
  for (const y of [-.52, -2.25]) trim(0, y, 0, .52, .22, .52, BRASS);
  return { panels, rivets, lights };
}

function makeWheel() {
  const parts = [];
  const add = (geometry, hex) => {
    const color = new Color(hex);
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) color.toArray(colors, i);
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    parts.push(geometry);
  };
  for (const z of [-.10, .10]) add(new TorusGeometry(.217, .047, 6, 14).translate(0, 0, z), INK);
  add(new CylinderGeometry(.093, .093, .28, 8).rotateX(PI / 2), BRASS);
  for (const angle of [0, PI / 3, PI * 2 / 3]) add(new BoxGeometry(.415, .048, .20).rotateZ(angle), "#83a092");
  const wheel = mergeGeometries(parts);
  parts.forEach((geometry) => geometry.dispose());
  return wheel;
}

export function Gondola({ cabin, index, motion }) {
  const wheels = useRef();
  const wheelGeometry = useMemo(makeWheel, []);
  useLayoutEffect(() => () => wheelGeometry.dispose(), [wheelGeometry]);
  const { panels, rivets, lights } = useMemo(() => cabinTrim(index), [index]);
  useFrame(() => {
    if (motion.reduced || (motion.quality >= 3 && (motion.stage < 1.4 || motion.stage >= 3))) return;
    const roll = (motion.cablePosition - .5) * (index ? -120 : 120);
    for (const wheel of wheels.current.children) wheel.rotation.z = roll;
  });
  // Portals keep cabin details parented to the tracked gondola, with no extra
  // frame of lag and no duplicate copy of its cable transform.
  return createPortal(
    <group name={`Gondola ${index + 1} detail`}>
      <Parts parts={panels} />
      <Parts parts={rivets} kind="rivets" />
      <Parts parts={lights} kind="lights" />
      <group ref={wheels}>
        {[-.62, .62].map((x) => (
          <mesh key={x} position={[x, .33, 0]} geometry={wheelGeometry}>
            <meshStandardMaterial vertexColors roughness={.59} />
          </mesh>
        ))}
      </group>
    </group>,
    cabin,
  );
}
