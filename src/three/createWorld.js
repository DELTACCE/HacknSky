import { createContext } from './context.js';
import { createEnvironment } from './Environment.js';
import { createTerrain } from './Terrain.js';
import { createWaterfall } from './Waterfall.js';
import { createCableRoute, createCableCar } from './CableCar.js';
import { createForest } from './Forest.js';
import { createWaterPark } from './WaterPark.js';
import { createCameraController } from './CameraController.js';

/**
 * Builds the whole procedural Athirappilly scene and returns a small runtime API:
 *   update(t, dt, progress)  advance animation
 *   camera                   camera choreography (apply(cam, progress, options))
 *   dispose()                release every GPU resource
 */
export async function createWorld(options) {
  const { scene, reduce } = options;
  const ctx = createContext(options);
  const merge = (part) => Object.assign(ctx, part);

  const dispose = () => {
    scene.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) {
        [].concat(o.material).forEach((m) => {
          Object.values(m).forEach((v) => v?.isTexture && v.dispose());
          m.dispose();
        });
      }
      o.customDepthMaterial?.dispose();
    });
    scene.environment?.dispose();
    ctx.pm?.dispose();
  };

  try {
    merge(await createEnvironment(ctx));
    merge(await createTerrain(ctx));
    merge(createWaterfall(ctx));
    await ctx.step('Growing the rainforest…', 34);
    merge(createCableRoute(ctx));
    await createForest(ctx);
    merge(await createCableCar(ctx));
    merge(await createWaterPark(ctx));

    // everything built above casts shadows (transparent glass/water excluded)
    [ctx.carrier, ...ctx.amb.map((a) => a.c), ctx.ven].forEach((root) =>
      root.traverse((o) => {
        if (o.isMesh && !o.material.transparent) o.castShadow = true;
      }),
    );
    await ctx.step('Ready.', 100);
    const camera = createCameraController(ctx);

    return {
      camera,
      update(t, dt, progress) {
        ctx.update(t, progress); // cable car (merged last, so `update` is the cable car's)
        ctx.envUpdate(dt);
        if (!reduce) {
          ctx.wm.uniforms.t.value = t;
          ctx.poolU.t.value = t;
          ctx.rm.uniforms.t.value = t;
        }
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
