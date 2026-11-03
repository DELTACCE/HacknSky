import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createRenderer } from './renderer.js';
import { createWorld } from './createWorld.js';
import { isLinearViewport, isLowPower } from '../utils/viewport.js';

/**
 * React host for the Three.js journey. It owns the canvas, render loop and every listener, and
 * tears all of it down (GPU resources included) on unmount.
 *
 * Callbacks: onProgress(p) every frame, onStatus(text, pct) while loading, onReady() once the
 * first frame (or the fallback) is ready, onMode({ linear, nogl }) when the layout must change.
 */
export default function Scene({ stageRef, pinRef, reduce, onProgress, onStatus, onReady, onMode }) {
  const hostRef = useRef(null);
  const callbacks = useRef({});
  callbacks.current = { onProgress, onStatus, onReady, onMode };

  useEffect(() => {
    const host = hostRef.current;
    const stage = stageRef.current;
    const pin = pinRef.current;
    if (!host || !stage || !pin) return undefined;

    const lo = isLowPower();
    const cleanups = [];
    const listen = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      cleanups.push(() => target.removeEventListener(type, fn, opts));
    };

    // The canvas is created per effect run so React StrictMode remounts never reuse a lost context.
    const canvas = document.createElement('canvas');
    canvas.id = 'gl';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    let renderer;
    try {
      renderer = createRenderer(canvas, lo);
    } catch {
      canvas.remove();
      callbacks.current.onMode({ linear: true, nogl: true });
      callbacks.current.onReady();
      return undefined;
    }

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(46, 1, 0.5, 900);
    let world = null;
    let disposed = false;
    let failed = false;
    let active = true;
    let linear = isLinearViewport(reduce);
    let reportedLinear;
    let raf = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let p = 0;
    let target = 0;
    let scrollRange = 1;
    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;

    const measure = () => {
      scrollRange = Math.max(1, stage.offsetHeight - pin.offsetHeight);
      const top = stage.getBoundingClientRect().top + scrollY;
      target = Math.min(1, Math.max(0, (scrollY - top) / scrollRange));
    };

    const render = (t, dt = 0) => {
      world.update(t, dt, p);
      world.camera.apply(cam, p, { mx, my, linear });
      if (!linear) callbacks.current.onProgress(p);
      renderer.render(scene, cam);
    };

    const frame = (ms) => {
      raf = 0;
      if (!active || document.hidden || linear) return;
      const delta = lastFrame ? (ms - lastFrame) / 1000 : 1 / 60;
      const dt = Math.min(delta, 0.05);
      lastFrame = ms;
      elapsed += dt;
      const ease = 1 - Math.exp(-delta * 10);
      p += (target - p) * ease;
      mx += (tx - mx) * ease;
      my += (ty - my) * ease;
      render(elapsed, dt);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf && !linear && !failed && active && !document.hidden) {
        lastFrame = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const size = () => {
      if (failed) return;
      linear = isLinearViewport(reduce);
      if (reportedLinear !== linear) {
        reportedLinear = linear;
        callbacks.current.onMode({ linear });
      }
      renderer.setSize(innerWidth, innerHeight, false);
      renderer.setPixelRatio(Math.min(devicePixelRatio, lo ? 1.25 : 1.75));
      cam.aspect = innerWidth / innerHeight;
      cam.fov = cam.aspect < 0.9 ? 62 : 46;
      cam.clearViewOffset();
      cam.updateProjectionMatrix();
      measure();
      if (linear) render(0);
      else start();
    };

    const fallback = () => {
      failed = true;
      active = false;
      cancelAnimationFrame(raf);
      canvas.style.display = 'none';
      callbacks.current.onMode({ linear: true, nogl: true });
    };

    (async () => {
      try {
        world = await createWorld({
          renderer,
          scene,
          lo,
          reduce,
          onProgress: (text, pct) => callbacks.current.onStatus(text, pct),
          isDisposed: () => disposed,
        });
      } catch (error) {
        if (disposed) return;
        console.warn('Visual journey unavailable; showing all chapters.', error);
        fallback();
        callbacks.current.onReady();
        return;
      }
      if (disposed) {
        world.dispose();
        return;
      }

      listen(window, 'resize', size, { passive: true });
      size();
      p = target;
      render(0);
      listen(
        window,
        'scroll',
        () => {
          measure();
          start();
        },
        { passive: true },
      );
      if (!lo && matchMedia('(pointer: fine)').matches) {
        listen(
          window,
          'pointermove',
          (e) => {
            tx = e.clientX / innerWidth - 0.5;
            ty = e.clientY / innerHeight - 0.5;
          },
          { passive: true },
        );
      }

      // Pause rendering while the journey is off-screen or the tab is hidden.
      const observer = new IntersectionObserver(
        (entries) => {
          active = entries[0].isIntersecting;
          canvas.style.visibility = active ? 'visible' : 'hidden';
          if (active) start();
          else {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        },
        { rootMargin: '100px' },
      );
      observer.observe(stage);
      cleanups.push(() => observer.disconnect());
      listen(document, 'visibilitychange', () => {
        if (document.hidden) {
          cancelAnimationFrame(raf);
          raf = 0;
        } else start();
      });
      listen(window, 'pageshow', start);
      listen(canvas, 'webglcontextlost', (e) => {
        e.preventDefault();
        fallback();
      });
      document.fonts?.ready.then(() => !disposed && measure());

      callbacks.current.onMode({ nogl: false });
      callbacks.current.onReady();
      start();
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanups.forEach((fn) => fn());
      world?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [reduce, stageRef, pinRef]);

  return <div ref={hostRef} className="gl-host" aria-hidden="true" />;
}
