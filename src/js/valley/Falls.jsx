import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, DoubleSide, DynamicDrawUsage, Object3D, UniformsLib, UniformsUtils } from "three";

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// The slick follows the existing curved curtain exactly. The narrow highlights
// stretch down the face and break into bright dashes at different speeds.
const slickVertex = `
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const slickFragment = `
  uniform float time;
  uniform vec2 flowBounds;
  varying vec2 vUv;
  #include <fog_pars_fragment>
  void main() {
    float column = vUv.x * 33.;
    float lane = floor(column);
    float offset = fract(sin(lane * 12.71) * 4375.14);
    float edge = smoothstep(.06, .17, vUv.x) * (1. - smoothstep(.83, .94, vUv.x));
    float streak = 1. - smoothstep(.03, .23, abs(fract(column + sin(vUv.y * .2) * .16) - .5));
    float pulse = sin(vUv.y * (.35 + offset * .75) - time * (3. + offset * 3.) + offset * 37.);
    float along = (vUv.y - flowBounds.x) / (flowBounds.y - flowBounds.x);
    float fade = smoothstep(0., .09, along) * (1. - smoothstep(.8, 1., along));
    gl_FragColor = vec4(.83, .98, 1., streak * edge * fade * mix(.14, .78, smoothstep(-.3, .85, pulse)));
    #include <fog_fragment>
  }
`;

function BankStones({ ground, riverX, fallZ, gradientMap, coarse }) {
  const mesh = useRef();
  const stones = useMemo(() => {
    const rand = seededRandom(827);
    return Array.from({ length: coarse ? 36 : 68 }, (_, i) => {
      const upstream = i % 7 < 2;
      const z = fallZ + (upstream ? -4.5 - rand() * 5 : 3.7 + rand() * 13);
      const x = riverX(z) + (i % 2 ? 1 : -1) * (4.5 + rand() * 5.5);
      const size = .32 + rand() ** 2 * 1.65;
      return { x, y: ground(x, z) - size * .28, z, size, yaw: rand() * Math.PI,
        color: ["#827455", "#a38a62", "#777a51", "#b19a73"][i % 4] };
    });
  }, [ground, riverX, fallZ, coarse]);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    const color = new Color();
    stones.forEach(({ x, y, z, size, yaw, color: hex }, i) => {
      dummy.position.set(x, y, z);
      dummy.scale.set(size * 1.35, size * .85, size);
      dummy.rotation.set(.22, yaw, .16);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
      mesh.current.setColorAt(i, color.set(hex));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.instanceColor.needsUpdate = true;
  }, [stones]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, stones.length]} receiveShadow>
    <icosahedronGeometry args={[1, 0]} />
    <meshToonMaterial gradientMap={gradientMap} />
  </instancedMesh>;
}

export function Falls({ curtain, ground, riverX, waterY, fallZ, gradientMap, motion }) {
  const foam = useRef(), spray = useRef(), wakes = useRef(), slick = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  const uniforms = useMemo(() => {
    const uv = curtain.geometry.attributes.uv;
    return UniformsUtils.merge([UniformsLib.fog, {
      time: { value: 0 }, flowBounds: { value: [uv.getY(0), uv.getY(uv.count - 1)] },
    }]);
  }, [curtain]);
  const { coarse, reduced } = motion;
  const [foamSeeds, spraySeeds] = useMemo(() => {
    const rand = seededRandom(217);
    const seeds = (count) => Array.from({ length: count }, () => [rand(), rand(), rand(), rand()]);
    return [seeds(coarse ? 22 : 38), seeds(coarse ? 26 : 92)];
  }, [coarse]);
  const footZ = fallZ + 4.8;
  const footX = riverX(footZ);

  function update() {
    const { time, quality, stage } = motion;
    const t = reduced ? 0 : time;
    const close = stage < 1.85;
    const fine = close && quality < 3;
    slick.current.visible = fine;
    uniforms.time.value = t;
    spray.current.visible = fine && !reduced;
    wakes.current.visible = close;
    foam.current.count = quality >= 3 ? 16 : foamSeeds.length;

    const write = (mesh, i, x, y, z, sx, sy, sz, pitch, yaw, roll) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(pitch, yaw, roll);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    };
    for (let i = 0; i < foam.current.count; i++) {
      const [a, b, c, d] = foamSeeds[i];
      const life = (b + t * (.12 + d * .09)) % 1;
      const z = footZ - .55 + life * (1.7 + c * 2.8);
      const size = (.28 + d * .72) * (.55 + Math.sin(life * Math.PI) * .58);
      write(foam.current, i, riverX(z) + (a - .5) * 7.5, waterY(z) + .25 + c * .55,
        z, size * 1.3, size * .64, size, 0, b * 6.28, 0);
    }
    foam.current.instanceMatrix.needsUpdate = true;

    if (spray.current.visible) {
      for (let i = 0; i < spraySeeds.length; i++) {
        const [a, b, c, d] = spraySeeds[i];
        const life = (a + t * (.48 + d * .34)) % 1;
        const size = (.035 + d * .098) * Math.sin(Math.PI * life);
        write(spray.current, i, footX + (b - .5) * (5.8 + life * 3.2),
          waterY(footZ) + .32 + 4 * life * (1 - life) * (1.2 + c * 2.5),
          footZ + life * (1.7 + c * 3.8), size, size * 1.7, size, life * 1.5, 0, 0);
      }
      spray.current.instanceMatrix.needsUpdate = true;
    }
    if (close) {
      for (let i = 0; i < 5; i++) {
        const life = (i / 5 + t * .31) % 1;
        const z = footZ + 2 + life * 5.2;
        const size = .35 + life * 2.35;
        write(wakes.current, i, riverX(z) + Math.sin(i * 2.4) * .75, waterY(z) + .035,
          z, size, size * .42, 1, -Math.PI / 2, 0, i * 1.24);
      }
      wakes.current.instanceMatrix.needsUpdate = true;
    }
  }
  useLayoutEffect(() => {
    for (const ref of [foam, spray, wakes]) ref.current.instanceMatrix.setUsage(DynamicDrawUsage);
    update();
  }, []);
  useFrame(update);

  return <group name="Falls detail">
    <mesh ref={slick} geometry={curtain.geometry} renderOrder={1}>
      <shaderMaterial uniforms={uniforms} vertexShader={slickVertex} fragmentShader={slickFragment}
        fog transparent depthWrite={false} side={DoubleSide}
        polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </mesh>
    <BankStones {...{ ground, riverX, fallZ, gradientMap, coarse }} />
    <instancedMesh ref={foam} args={[undefined, undefined, foamSeeds.length]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshToonMaterial gradientMap={gradientMap} color="#f5ffff" emissive="#9dcce2" emissiveIntensity={.24} />
    </instancedMesh>
    <instancedMesh ref={spray} args={[undefined, undefined, spraySeeds.length]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#e6fbff" />
    </instancedMesh>
    <instancedMesh ref={wakes} args={[undefined, undefined, 5]} renderOrder={2} frustumCulled={false}>
      <ringGeometry args={[.94, 1, 24, 1, 0, Math.PI * 1.55]} />
      <meshBasicMaterial color="#e3fcff" transparent opacity={.53} depthWrite={false} />
    </instancedMesh>
  </group>;
}
