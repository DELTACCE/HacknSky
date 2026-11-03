import * as T from 'three';
import { V, UP, rnd, ss, C, hs, vn, fbm, cyl, bx } from './utils.js';

/**
 * Shared context handed to every scene module. Modules read what they need from it and
 * the world builder merges each module's return value back in (terrain -> `ter`, etc.).
 */
export function createContext({ renderer, scene, lo, reduce, onProgress, isDisposed }) {
  const step = async (text, pct) => {
    if (isDisposed()) throw new Error('Scene disposed');
    onProgress?.(text, pct);
    await new Promise((resolve) => setTimeout(resolve, 30));
  };
  return { T, V, UP, rnd, ss, C, hs, vn, fbm, cyl, bx, renderer, scene, lo, reduce, step };
}
