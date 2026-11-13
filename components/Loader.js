"use client";

import { useEffect, useState } from "react";
import { emitReady } from "@/lib/scrollState";

// Loading screen tied to real milestones: fonts, the WebGL canvas, and the
// first rendered frames. A minimum hold avoids a flash, and a failsafe lifts
// it even if WebGL never reports in.
const WEIGHTS = { fonts: 0.2, scene: 0.2, canvas: 0.25, rendered: 0.35 };
const MIN_MS = 950;
const FAILSAFE_MS = 15000;

export default function Loader() {
  const [progress, setProgress] = useState(0.06);
  const [phase, setPhase] = useState("loading"); // loading | leaving | gone

  useEffect(() => {
    const start = performance.now();
    const done = {};
    let finished = false;

    const total = () => Object.keys(done).reduce((a, k) => a + (WEIGHTS[k] || 0), 0);

    const finish = () => {
      if (finished) return;
      finished = true;
      setProgress(1);
      const wait = Math.max(0, MIN_MS - (performance.now() - start));
      setTimeout(() => {
        setPhase("leaving");
        emitReady();
        setTimeout(() => setPhase("gone"), 800);
      }, wait);
    };

    const mark = (name) => {
      if (name in WEIGHTS) done[name] = true;
      setProgress(Math.max(0.06, total()));
      if (total() >= 0.999) finish();
    };

    Object.keys(window.__hnsStages || {}).forEach(mark);
    const onStage = (e) => mark(e.detail);
    window.addEventListener("hacknsky:stage", onStage);
    window.addEventListener("hacknsky:ready", finish);

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => mark("fonts"), () => mark("fonts"));
    } else {
      mark("fonts");
    }

    let webgl = true;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch (e) {
      webgl = false;
    }
    const fail = setTimeout(finish, webgl ? FAILSAFE_MS : 700);

    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    return () => {
      clearTimeout(fail);
      window.removeEventListener("hacknsky:stage", onStage);
      window.removeEventListener("hacknsky:ready", finish);
      document.documentElement.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (phase === "gone") document.documentElement.style.overflow = "";
  }, [phase]);

  if (phase === "gone") return null;
  const pct = Math.round(progress * 100);

  return (
    <div
      className={`loader ${phase === "leaving" ? "loader-out" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${pct}%`}
    >
      <div className="loader-inner">
        <svg viewBox="0 0 320 150" className="loader-svg" aria-hidden="true">
          <line x1="0" y1="26" x2="320" y2="26" className="loader-cable" />
          <g className="loader-ride">
            <g transform="translate(160 26)">
              <rect x="-2.2" y="-3" width="4.4" height="6" rx="1" fill="#2c4a6e" />
              <line x1="0" y1="3" x2="0" y2="26" stroke="#8a5a3a" strokeWidth="3" />
              <g className="loader-sway">
                <rect x="-26" y="26" width="52" height="4" rx="2" fill="#2c4a6e" />
                <polygon
                  points="-30,40 0,28 30,40"
                  fill="#f7efe0"
                  stroke="#2c4a6e"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <rect x="-24" y="40" width="48" height="30" rx="3" fill="#f7efe0" stroke="#2c4a6e" strokeWidth="2.5" />
                <rect x="-24" y="56" width="48" height="6" fill="#e0714a" />
                <rect x="-19" y="45" width="16" height="10" rx="1.5" fill="#79bfd8" stroke="#2c4a6e" strokeWidth="1.5" />
                <rect x="3" y="45" width="16" height="10" rx="1.5" fill="#79bfd8" stroke="#2c4a6e" strokeWidth="1.5" />
                <rect x="-24" y="66" width="48" height="5" rx="2" fill="#2c4a6e" />
              </g>
            </g>
          </g>
          <g className="loader-mtn" fill="#2d6a4c">
            <polygon points="0,150 60,112 100,136 150,98 200,132 250,108 320,150" opacity="0.5" />
            <polygon points="0,150 40,130 90,150" />
            <polygon points="320,150 270,126 220,150" />
          </g>
        </svg>
        <p className="loader-name">HacknSky</p>
        <div className="loader-bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        <p className="loader-pct">{pct}%</p>
      </div>
    </div>
  );
}
