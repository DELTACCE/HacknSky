import * as T from 'three';
import { C } from './utils.js';
/**
 * The Athirappilly waterfall ribbon (animated shader) and the mist at its base.
 */

export function createWaterfall(ctx) {
  const { ctex, scene, ter } = ctx;
  // waterfall ribbon following the escarpment
  const wg = new T.PlaneGeometry(17, 1, 10, 40),
    wp = wg.attributes.position;
  for (let i = 0; i < wp.count; i++) {
    const x = 14 + wp.getX(i),
      z = -94 + (wp.getY(i) + 0.5) * 18;
    wp.setXYZ(i, x, ter(x, z) + 0.7, z);
  }
  const wm = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    uniforms: { t: { value: 0 } },
    vertexShader:
      'varying vec2 u;varying float dd;void main(){u=uv;vec4 m=modelViewMatrix*vec4(position,1.);dd=-m.z;gl_Position=projectionMatrix*m;}',
    fragmentShader:
      'varying vec2 u;varying float dd;uniform float t;float h(float x){return fract(sin(x*12.9898)*43758.5);}void main(){float e=smoothstep(0.,.12,u.x)*smoothstep(1.,.88,u.x)*smoothstep(0.,.05,u.y);float cx=floor(u.x*60.),s=h(cx);float f=.5+.5*sin(u.y*(18.+s*30.)-t*(4.+s*3.)+s*40.);float k=.55+.45*f;float core=smoothstep(.0,.5,1.-abs(u.x-.5)*1.6);float foam=smoothstep(.2,0.,u.y)*.6;vec3 c=mix(vec3(.78,.9,.95),vec3(1.),k*core+foam);c=mix(c,vec3(.85,.65,.49),1.-exp(-pow(dd*.004,2.)));gl_FragColor=vec4(c,clamp((.35+.6*k)*e*(.75+.25*core),0.,1.));}',
  });
  scene.add(new T.Mesh(wg, wm));
  {
    const s = new T.Sprite(
      new T.SpriteMaterial({
        map: ctex,
        color: C(0xffffff),
        opacity: 0.5,
        depthWrite: false,
      }),
    );
    s.scale.set(50, 26, 1);
    s.position.set(14, ter(14, -74) + 6, -74);
    scene.add(s);
  }
  [
    [8, -80],
    [14, -78],
    [20, -80],
  ].forEach(([x, z], i) => {
    const s = new T.Sprite(
      new T.SpriteMaterial({
        map: ctex,
        color: C(0xffffff),
        opacity: 0.38,
        depthWrite: false,
      }),
    );
    s.scale.set(34, 18, 1);
    s.position.set(x, ter(x, z) + 4 + i, z);
    scene.add(s);
  });

  return { wm };
}
