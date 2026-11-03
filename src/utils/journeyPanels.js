import { JOURNEY_RANGES, CHAPTERS } from '../data/journey.js';
import { ss } from './math.js';

/** Index of the chapter that owns scroll progress `p`. */
export const chapterAt = (p) =>
  Math.max(
    0,
    JOURNEY_RANGES.findIndex(([a, b]) => p >= a && p < b),
  );

/**
 * Cross-fades the pinned chapter panels for progress `p`.
 * Imperative on purpose: it runs every animation frame, so it writes straight to the DOM
 * instead of triggering React renders.
 */
export function updatePanels(p, panels, progressLine) {
  progressLine?.style.setProperty('--progress', p);
  const last = CHAPTERS.length - 1;
  panels.forEach((el, i) => {
    if (!el) return;
    const [a, b] = JOURNEY_RANGES[i];
    const w = 0.018;
    let o = ss(a, a + w, p) * (1 - ss(b - w, b, p));
    if (i === 0) o = 1 - ss(0.082, 0.1, p);
    if (i === last) o = ss(0.88, 0.905, p);
    const k = Math.min(1, Math.max(0, (p - a) / (b - a)));
    el.style.opacity = o;
    el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
    el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    el.inert = o <= 0.5;
    el.setAttribute('aria-hidden', o <= 0.5 ? 'true' : 'false');
    el.style.setProperty('--k', k);
    el.firstElementChild.style.transform = `translateY(${(1 - o) * 24}px)`;
  });
}

/** Makes every chapter reachable again (linear / no-WebGL layouts). */
export function resetPanels(panels) {
  panels.forEach((el) => {
    if (!el) return;
    el.inert = false;
    el.removeAttribute('aria-hidden');
  });
}
