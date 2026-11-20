export const mobile = matchMedia("(pointer: coarse)").matches || screen.width < 700;
export const textureNames = ["l0", "l1", "l2", "l3", "l4", "l5", "l6", "l7", "base", "panel_mask", "wf", "cable", "gondola", "bird"];
export const textureUrl = (name) => `/assets/brand/${name}.webp`;
