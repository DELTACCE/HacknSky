/** Smoothstep of `t` between `a` and `b` (clamped). Dependency-free so UI code can use it. */
export const ss = (a, b, t) => {
  t = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
