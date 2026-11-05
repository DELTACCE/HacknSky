"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState, SCENE_STAGES } from "@/lib/scrollState";
import { usePrefersReducedMotion } from "@/lib/hooks";

// Renders nothing. Wires the DOM to the 3D world:
//  - maps scroll position onto a "stage" (0 hero · 1 destination · 2 cable
//    car · 3 registration) that the camera rig and cabin read every frame
//  - pauses rendering while opaque sections fully cover the canvas
//  - pointer parallax, and GSAP reveal animations
// Deliberately imports no three.js, so the 3D bundle stays lazy.
export default function ScrollController() {
  const reduced = usePrefersReducedMotion();

  // --- scroll -> world ------------------------------------------------------
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const byId = (id) => document.getElementById(id);
    let anchors = null;
    let lastY = window.scrollY;

    // Each leg of the journey is eased independently, so the camera leaves and
    // arrives at an anchor at zero speed. That is what makes a scroll journey
    // read as a sequence of deliberate moves instead of one long slide.
    const LEG_EASE = [1.8, 1.45, 1.2, 1.7];
    const easeInOut = (t, p) =>
      t < 0.5
        ? 0.5 * Math.pow(2 * t, p)
        : 1 - 0.5 * Math.pow(2 * (1 - t), p);

    const compute = () => {
      const hero = byId("top");
      const dest = byId("destination");
      const cable = byId("cable-car");
      const reg = byId("register");
      if (!hero || !dest || !cable || !reg) return;
      const top = (n) => n.getBoundingClientRect().top + window.scrollY;
      const vh = window.innerHeight;
      const cableTop = top(cable);
      const cableBottom = cableTop + cable.offsetHeight;
      const regTop = top(reg);
      const endPin = Math.max(cableTop + 1, cableBottom - vh);
      anchors = {
        stops: [
          [top(hero), 0],
          [top(dest), 1],
          [cableTop, 2],
          [endPin, 2.7],
          [Math.max(endPin + 1, regTop - vh), 3],
        ],
        cableBottom,
        regTop,
        vh,
      };
    };

    const update = () => {
      if (!anchors) return;
      const sy = window.scrollY;
      const { stops } = anchors;
      let stage = SCENE_STAGES;
      if (sy <= stops[0][0]) {
        stage = 0;
      } else {
        for (let i = 0; i < stops.length - 1; i++) {
          const [a, sa] = stops[i];
          const [b, sb] = stops[i + 1];
          if (sy <= b) {
            const t = Math.min(1, Math.max(0, (sy - a) / (b - a)));
            stage = sa + (sb - sa) * easeInOut(t, LEG_EASE[i] || 1.4);
            break;
          }
        }
      }
      scrollState.stage = stage;
      scrollState.progress = stage / SCENE_STAGES;
      scrollState.active = !(sy >= anchors.cableBottom && sy + anchors.vh <= anchors.regTop);

      // scroll speed, smoothed: lets the scene react to a flick vs a slow drag
      const raw = Math.abs(sy - lastY);
      lastY = sy;
      scrollState.velocity += (Math.min(raw, 90) - scrollState.velocity) * 0.25;

      // how parked are we? 1 while the camera sits on an anchor and only the
      // copy moves, which is where a still frame would otherwise feel dead
      const nearest = stops.reduce(
        (best, [y, s]) => (Math.abs(s - stage) < Math.abs(best - stage) ? s : best),
        0
      );
      const dist = Math.abs(stage - nearest);
      scrollState.dwell = Math.max(0, 1 - dist / 0.35);

      // little station A -> B progress bar in the cable-car section
      const f = Math.min(1, Math.max(0, (stage - 2) / 0.7));
      document.querySelectorAll("[data-car-fill]").forEach((n) => {
        n.style.transform = `scaleX(${f})`;
      });
    };

    const onRefresh = () => {
      compute();
      update();
    };

    compute();
    update();
    const st = ScrollTrigger.create({ start: 0, end: "max", onUpdate: update });
    ScrollTrigger.addEventListener("refresh", onRefresh);
    window.addEventListener("resize", onRefresh);

    // layout shifts once web fonts arrive
    let fontsTimer;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fontsTimer = setTimeout(() => ScrollTrigger.refresh(true), 50);
      });
    }

    return () => {
      clearTimeout(fontsTimer);
      st.kill();
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("resize", onRefresh);
    };
  }, []);

  // --- pointer parallax -----------------------------------------------------
  useEffect(() => {
    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      scrollState.pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      scrollState.pointer.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // --- reveal animations ----------------------------------------------------
  useEffect(() => {
    if (reduced) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-in]", {
        yPercent: 60,
        opacity: 0,
        duration: 1.1,
        stagger: 0.12,
        ease: "power4.out",
        delay: 0.15,
      });

      gsap.utils.toArray("[data-reveal]").forEach((node) => {
        gsap.from(node, {
          y: 36,
          opacity: 0,
          duration: 0.9,
          delay: Number(node.dataset.reveal) || 0,
          ease: "power3.out",
          scrollTrigger: { trigger: node, start: "top 78%", once: true },
        });
      });

      gsap.utils.toArray("[data-stagger]").forEach((group) => {
        gsap.from(group.children, {
          y: 28,
          opacity: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: group, start: "top 76%", once: true },
        });
      });
    });
    return () => ctx.revert();
  }, [reduced]);

  return null;
}
