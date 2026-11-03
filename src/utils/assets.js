/**
 * Single place that resolves public asset URLs (respects Vite's `base`).
 * Files live in /public/assets/{images,textures,icons,models}. The current 3D scene is fully
 * procedural, so those folders are intentionally empty until real assets are added.
 */
const base = import.meta.env.BASE_URL;

const join = (...parts) => (base + parts.join('/')).replace(/\/{2,}/g, '/');

export const ASSETS = {
  favicon: join('favicon.svg'),
  image: (name) => join('assets/images', name),
  texture: (name) => join('assets/textures', name),
  icon: (name) => join('assets/icons', name),
  model: (name) => join('assets/models', name),
};
