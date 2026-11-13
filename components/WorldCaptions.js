"use client";

import { Component, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import { cameraPose } from "@/lib/cameraPath";
import { cablePoint, carT } from "@/lib/world";
import { timeUniform } from "@/lib/shaders";
import { CAP_MID, PX, drawUnit, measureLine } from "@/lib/captionTexture";

// ---------------------------------------------------------------------------
// In-world captions (MiSide style).
//
// Every letter or word is its own textured quad living in the Three.js scene:
// outlined, gradient filled, with a dark slab behind it for thickness, tilted in
// perspective and animated piece by piece. They are NOT an HTML overlay.
//
// Each caption is anchored in WORLD space where the camera will be looking when
// the reader reaches that scroll stage (lib/cameraPath.js mirrors the camera
// rig). Once placed it stays put, so the camera swings past it with real
// parallax. Timing comes from ScrollController, which writes
// scrollState.caps[id] = "out" | "in" | "gone" for each beat.
//
// Glyphs are drawn with the page's own font (Outfit) onto 2D canvases, so there
// is no extra font file, worker or async parser to fail.
// ---------------------------------------------------------------------------

// true: trees, cables and railings can pass in front of the letters.
// false: letters always draw on top of the scene.
const OCCLUDE = true;

const CREAM = "#fbf5e7";
const WARM = "#fffaf0";
const LIME = "#c6f04e";
const PALE_LIME = "#dcf58a";

const ENTER = 0.8; // seconds for one piece to settle
const EXIT = 0.42;

const GEO = new THREE.PlaneGeometry(1, 1);

// --- helpers ---------------------------------------------------------------
const hash = (i, k) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const easeOutBack = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const y = x - 1;
  return 1 + c3 * y * y * y + c1 * y * y;
};
const smooth01 = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
const colA = new THREE.Color();
const colB = new THREE.Color();
const mix = (a, b, t) => `#${colA.set(a).lerp(colB.set(b), t).getHexString()}`;

// ---------------------------------------------------------------------------
// Caption specs. `size` is the heading height as a fraction of screen height;
// each line's `rel` scales from it. (nx, ny) is the block's left edge / vertical
// anchor in screen NDC at the stage's camera pose, i.e. where it lands on
// screen when the camera arrives: away from the cabin and the waterfall.
// ---------------------------------------------------------------------------
function getSpecs(portrait) {
  const P = portrait;
  const eyebrow = { font: "semi", ls: 0.16, c0: WARM, c1: CREAM, unit: "word", outline: 0.14 };
  const label = { font: "semi", ls: 0.2, c0: "#e3fb8f", c1: LIME, unit: "word", outline: 0.14 };
  const body = { font: "semi", ls: 0, c0: WARM, c1: CREAM, unit: "word", outline: 0.12 };
  const head = { font: "black", ls: -0.02, c0: WARM, c1: PALE_LIME, unit: "char", outline: 0.075 };

  const left = -0.88;
  const maxW = P ? 0.88 : 0.5;

  return {
    hero: {
      stage: 0,
      d: 15,
      nx: left,
      ny: P ? 0.76 : 0.08,
      anchor: P ? "top" : "center",
      size: P ? 0.07 : 0.14,
      maxW: P ? 0.88 : 0.5,
      tilt: [0.03, 0.2, 0.04],
      lines: [
        { ...eyebrow, t: "ATHIRAPPILLY, KERALA  ·  15–16 JAN 2027", rel: 0.2, gap: 0.06, delay: 0 },
        { ...head, t: "HacknSky", rel: 1, lh: 1.0, gap: 0.1, delay: 0.15 },
        { ...eyebrow, t: "LESS ORDINARY. MORE ALTITUDE.", rel: 0.18, unit: "char", ls: 0.2, delay: 0.75 },
      ],
    },

    dest: {
      stage: 1.18,
      d: 11,
      nx: left,
      ny: P ? -0.9 : 0.12,
      anchor: P ? "bottom" : "center",
      size: P ? 0.055 : 0.085,
      maxW: P ? 0.88 : 0.4,
      tilt: [-0.03, 0.24, 0.03],
      lines: [
        { ...label, t: "01 — THE DESTINATION", rel: 0.26, gap: 0.1, delay: 0 },
        { ...head, t: "Where the forest", rel: 1, lh: 1.0, delay: 0.12 },
        { ...head, t: "breaks open.", rel: 1, lh: 1.0, gap: 0.14, delay: 0.5 },
        { ...body, t: "The Chalakudy River drops into the rainforest.", rel: 0.3, lh: 1.3, delay: 0.95 },
        { ...body, t: "Mist, hornbills, one very loud waterfall.", rel: 0.3, lh: 1.3, gap: 0.14, delay: 1.2 },
        { ...label, t: "~24 M DROP  ·  20 TEAMS  ·  2 PER TEAM", rel: 0.17, ls: 0.14, delay: 1.45 },
      ],
    },

    // The cable-car captions ride along with the gondola (follow: "cabin"): the
    // camera tracks the cabin across the valley, so a text anchored to a fixed
    // spot in the world would swing off screen mid-sentence.
    "cable-a": {
      stage: 2.0,
      follow: true,
      nx: left,
      ny: P ? 0.74 : -0.9,
      anchor: P ? "top" : "bottom",
      size: P ? 0.055 : 0.074,
      maxW: P ? 0.88 : 0.42,
      tilt: [0.03, 0.2, -0.03],
      lines: [
        { ...label, t: "02 — THE CABLE CAR", rel: 0.26, gap: 0.12, delay: 0 },
        { ...head, t: "The view you’re", rel: 1, lh: 1.0, delay: 0.12 },
        { ...head, t: "building for.", rel: 1, lh: 1.0, gap: 0.16, delay: 0.5 },
        { ...body, t: "The reward at the end of the build.", rel: 0.34, lh: 1.3, delay: 0.95 },
      ],
    },

    "cable-b": {
      stage: 2.0,
      follow: true,
      nx: left,
      ny: P ? 0.74 : -0.9,
      anchor: P ? "top" : "bottom",
      size: P ? 0.055 : 0.074,
      maxW: P ? 0.88 : 0.42,
      tilt: [0.03, 0.2, -0.03],
      lines: [
        { ...label, t: "02 — ALONG THE LINE", rel: 0.26, gap: 0.14, delay: 0 },
        { ...head, t: "Two cabins, one valley.", rel: 0.56, lh: 1.15, delay: 0.14 },
        { ...head, t: "Teams ride out together.", rel: 0.56, lh: 1.15, delay: 0.42 },
        { ...head, t: "Finals pitched at sunset.", rel: 0.56, lh: 1.15, gap: 0.18, delay: 0.7 },
        { ...label, t: "RIDE PROPOSED FOR FINALISTS  ·  SUBJECT TO CONFIRMATION", rel: 0.15, ls: 0.1, delay: 1.0 },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Texture building: one front + one back canvas texture per animated piece
// ---------------------------------------------------------------------------
function makeTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

function buildLine(line, family, measureCtx) {
  const m = measureLine(measureCtx, line, family);
  const n = m.units.length;
  const units = m.units.map((u, i) => {
    const k = n > 1 ? i / (n - 1) : 0;
    // letters get a vertical gradient; across the line the tint drifts cream -> lime-ish
    const fills = [mix(line.c0, line.c1, k * 0.6), line.c1];
    const cf = document.createElement("canvas");
    const cb = document.createElement("canvas");
    const dims = drawUnit(cf, u, line, family, "front", fills);
    drawUnit(cb, u, line, family, "back", fills);
    return { ...u, ...dims, front: makeTexture(cf), back: makeTexture(cb) };
  });
  return { emW: m.emW, units };
}

// ---------------------------------------------------------------------------
// One line: a row of independently animated quads
// ---------------------------------------------------------------------------
function WorldLine({ capId, line, asset, size, y, startDelay }) {
  const root = useRef();
  const pieces = useRef([]); // per unit: { p, g, front, back }
  const clock = useRef({ vis: false, t: 0 });
  const step = line.unit === "char" ? 0.05 : 0.1;
  const px = PX[line.font];
  const k = size / px; // world units per texture pixel

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const c = clock.current;
    const vis = scrollState.caps[capId] === "in";
    if (vis && !c.vis) c.t = 0;
    c.vis = vis;
    if (vis) c.t += dt;
    const reduced = scrollState.reduced;
    const time = state.clock.elapsedTime;

    let any = false;
    asset.units.forEach((u, i) => {
      const pc = pieces.current[i];
      if (!pc || !pc.g) return;

      if (reduced) pc.p = vis ? 1 : 0;
      else if (vis) {
        if (c.t > startDelay + i * step) pc.p = Math.min(1, pc.p + dt / ENTER);
      } else pc.p = Math.max(0, pc.p - dt / EXIT);

      const p = pc.p;
      pc.g.visible = p > 0.002;
      if (p <= 0.002) return;
      any = true;

      const r1 = hash(i, 1) - 0.5;
      const r2 = hash(i, 2);
      const r3 = hash(i, 3) - 0.5;
      let ox;
      let oy;
      let oz;
      let rz;
      let sc;
      if (vis || reduced) {
        // pop up from below with a little scatter and an overshoot
        const e = easeOutBack(p);
        const inv = 1 - e;
        ox = r1 * size * 1.6 * inv;
        oy = -size * (0.9 + r2 * 0.9) * inv;
        oz = r3 * size * 1.2 * inv;
        rz = r3 * 1.6 * inv;
        sc = Math.max(0.001, e);
      } else {
        // lift off and drift away into the depth of the scene
        const inv = 1 - smooth01(p);
        ox = r1 * size * 1.2 * inv;
        oy = size * (0.8 + r2 * 0.8) * inv;
        oz = -size * 3 * inv;
        rz = r3 * 1.2 * inv;
        sc = 0.55 + 0.45 * p;
      }
      const settle = reduced ? 0 : smooth01((p - 0.7) / 0.3);
      oy += Math.sin(time * 1.5 + i * 0.7) * size * 0.035 * settle;
      rz += Math.sin(time * 1.1 + i * 1.3) * 0.03 * settle;

      pc.g.position.set((u.x0 + u.w / 2) * size + ox, oy, oz);
      pc.g.rotation.z = rz;
      pc.g.scale.setScalar(sc);

      const o = smooth01(p * 1.7);
      if (pc.front) pc.front.material.opacity = o;
      if (pc.back) pc.back.material.opacity = o * 0.95;
    });
    if (root.current) root.current.visible = any;
  });

  const slot = (i) => (pieces.current[i] = pieces.current[i] || { p: 0, g: null, front: null, back: null });

  return (
    <group ref={root} position={[0, y, 0]} visible={false}>
      {asset.units.map((u, i) => {
        const quadW = u.cw * k;
        const quadH = u.ch * k;
        // baseline sits CAP_MID*size below the row centre; the quad centre is above the baseline
        const yOff = -CAP_MID * size + (u.by - u.ch / 2) * k;
        const common = {
          geometry: GEO,
          scale: [quadW, quadH, 1],
          frustumCulled: false,
        };
        const mat = (map, depthTest = OCCLUDE) => (
          <meshBasicMaterial
            map={map}
            transparent
            opacity={0}
            depthWrite={false}
            depthTest={depthTest}
            fog={false}
            toneMapped={false}
          />
        );
        return (
          <group
            key={`${u.t}-${i}`}
            ref={(g) => {
              slot(i).g = g;
            }}
            position={[(u.x0 + u.w / 2) * size, 0, 0]}
            visible={false}
          >
            <mesh
              {...common}
              ref={(m) => {
                slot(i).back = m;
              }}
              position={[size * 0.03, yOff - size * 0.035, -size * 0.06]}
              renderOrder={19}
            >
              {mat(u.back)}
            </mesh>
            <mesh
              {...common}
              ref={(m) => {
                slot(i).front = m;
              }}
              position={[0, yOff, 0]}
              renderOrder={20}
            >
              {mat(u.front)}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// One caption: lays its lines out as a block and pins it in world space at the
// camera pose for its stage.
// ---------------------------------------------------------------------------
function Caption({ id, spec, assets, aspect, portrait }) {
  const layout = useMemo(() => {
    const pose = cameraPose(spec.stage, { portrait });
    const fwd = pose.tgt.clone().sub(pose.pos).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();

    const depth = spec.follow ? pose.pos.distanceTo(pose.tgt) : spec.d;
    const halfH = depth * Math.tan(THREE.MathUtils.degToRad(pose.fov / 2));
    const halfW = halfH * aspect;
    const base = spec.size * 2 * halfH;

    // fit the widest line inside maxW of the screen width
    let widest = 0;
    spec.lines.forEach((l, i) => {
      widest = Math.max(widest, assets[i].emW * base * l.rel);
    });
    const fit = Math.min(1, (spec.maxW * 2 * halfW) / Math.max(widest, 1e-6));
    const title = base * fit;

    let cursor = 0;
    const rows = spec.lines.map((l) => {
      const size = title * l.rel;
      const lh = (l.lh || 1.25) * size;
      const row = { size, y: -(cursor + lh / 2) };
      cursor += lh + (l.gap || 0) * title;
      return row;
    });
    const shift = spec.anchor === "bottom" ? cursor : spec.anchor === "center" ? cursor / 2 : 0;

    const follow = spec.follow
      ? { dx: spec.nx * halfW, dy: spec.ny * halfH + shift }
      : null;
    const origin = pose.pos
      .clone()
      .addScaledVector(fwd, depth)
      .addScaledVector(right, spec.nx * halfW)
      .addScaledVector(up, spec.ny * halfH + shift);

    // face back toward the camera: local +x = right, +y = up, +z = toward viewer
    const m = new THREE.Matrix4().makeBasis(right, up, fwd.clone().negate());
    const quat = new THREE.Quaternion().setFromRotationMatrix(m);
    return { origin, quat, rows, follow };
  }, [spec, assets, aspect, portrait]);

  const anchor = useRef();
  const tmp = useMemo(
    () => ({ car: new THREE.Vector3(), r: new THREE.Vector3(), u: new THREE.Vector3() }),
    []
  );
  useFrame(({ camera }) => {
    const f = layout.follow;
    if (!f || !anchor.current) return;
    // same cabin position the camera rig is looking at
    cablePoint(carT(scrollState.smooth, timeUniform.value), 0, tmp.car);
    tmp.car.y -= 2.6;
    tmp.r.set(1, 0, 0).applyQuaternion(camera.quaternion);
    tmp.u.set(0, 1, 0).applyQuaternion(camera.quaternion);
    anchor.current.position.copy(tmp.car).addScaledVector(tmp.r, f.dx).addScaledVector(tmp.u, f.dy);
    anchor.current.quaternion.copy(camera.quaternion);
  });

  // The plain HTML copy of this caption is what people see until the 3D text
  // exists. From here on it is kept for screen readers only (see globals.css).
  useEffect(() => {
    const els = [...document.querySelectorAll(`[data-cap-id="${id}"]`)];
    els.forEach((el) => {
      el.dataset.world = "on";
      const hero = el.closest(".hero");
      if (hero) hero.dataset.world = "on";
    });
    return () => {
      els.forEach((el) => {
        delete el.dataset.world;
        const hero = el.closest(".hero");
        if (hero) delete hero.dataset.world;
      });
    };
  }, [id]);

  return (
    <group ref={anchor} position={layout.origin} quaternion={layout.quat}>
      <group rotation={spec.tilt}>
        {layout.rows.map((row, i) => (
          <WorldLine
            key={i}
            capId={id}
            line={spec.lines[i]}
            asset={assets[i]}
            size={row.size}
            y={row.y}
            startDelay={spec.lines[i].delay}
          />
        ))}
      </group>
    </group>
  );
}

// If anything here ever fails, drop the 3D text and keep the world alive.
class Guard extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.error("[HacknSky] 3D captions disabled:", err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Captions() {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const portrait = width / height < 0.9;
  const aspect = Math.round((width / height) * 20) / 20; // ignore toolbar-resize jitter
  const specs = useMemo(() => getSpecs(portrait), [portrait]);
  const [family, setFamily] = useState(null);

  // wait for the page font, then build every glyph texture once
  useEffect(() => {
    let alive = true;
    const css = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
    const first = css.split(",")[0].trim();
    const ready = document.fonts
      ? Promise.race([
          Promise.all([
            document.fonts.load(`800 100px ${first}`),
            document.fonts.load(`600 100px ${first}`),
          ]),
          new Promise((r) => setTimeout(r, 2500)),
        ])
      : Promise.resolve();
    ready.catch(() => {}).then(() => alive && setFamily(css));
    return () => {
      alive = false;
    };
  }, []);

  const built = useMemo(() => {
    if (!family) return null;
    const ctx = document.createElement("canvas").getContext("2d");
    const out = {};
    Object.entries(specs).forEach(([id, spec]) => {
      out[id] = spec.lines.map((l) => {
        return buildLine(l, family, ctx);
      });
    });
    return out;
  }, [family, specs]);

  useEffect(
    () => () => {
      if (!built) return;
      Object.values(built).forEach((lines) =>
        lines.forEach((a) =>
          a.units.forEach((u) => {
            u.front.dispose();
            u.back.dispose();
          })
        )
      );
    },
    [built]
  );

  if (!built) return null;
  return Object.entries(specs).map(([id, spec]) => (
    <Caption
      key={`${id}-${portrait}`}
      id={id}
      spec={spec}
      assets={built[id]}
      aspect={aspect}
      portrait={portrait}
    />
  ));
}

export default function WorldCaptions() {
  return (
    <Guard>
      <Captions />
    </Guard>
  );
}
