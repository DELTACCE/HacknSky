"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// The whole WebGL bundle (three + r3f) is split out and only loaded in the
// browser, after first paint.
const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

export default function SceneLayer() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasWebGL()) return;
    let cancel;
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: 700 });
      cancel = () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => setReady(true), 200);
      cancel = () => clearTimeout(id);
    }
    return cancel;
  }, []);

  return (
    <div className="scene-layer" aria-hidden="true">
      {ready && <HeroScene />}
    </div>
  );
}
