/** Short or reduced-motion screens use normal document flow instead of the pinned journey. */
export const isLinearViewport = (reduceMotion) =>
  reduceMotion || innerHeight < (innerWidth > 820 ? 700 : 600);

/** Small screens / low-memory devices get cheaper rendering (no shadows, fewer instances). */
export const isLowPower = () =>
  innerWidth < 760 || Boolean(navigator.deviceMemory && navigator.deviceMemory < 4);
