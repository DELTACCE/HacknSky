"use client";

import { useEffect, useState } from "react";
import { scrollState } from "./scrollState";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReduced(mq.matches);
      scrollState.reduced = mq.matches;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const apply = () => setMobile(window.innerWidth < breakpoint);
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [breakpoint]);
  return mobile;
}

// Cheap heuristic for phones that will struggle with the full scene: few
// cores, little memory, or the user asked for reduced motion. Fill rate is the
// real cost on these devices, so the scene also drops to a 1x backbuffer.
export function useLowPower(mobile) {
  const [low, setLow] = useState(false);
  useEffect(() => {
    if (!mobile) {
      setLow(false);
      return;
    }
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setLow(reduced || cores <= 4 || mem <= 4 || coarse);
  }, [mobile]);
  return low;
}
