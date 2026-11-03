import * as T from 'three';
import { C, V, fbm } from './utils.js';
/**
 * Atmosphere: fog, sky dome, sun/hemisphere lighting, image-based lighting, distant ridgelines and drifting valley mist.
 */

export async function createEnvironment(ctx) {
  const { lo, reduce, renderer, scene, step } = ctx;
  scene.fog = new T.FogExp2(C(0xd6b392), 0.0038);
  const fogC = C(0xd6b392);
  await step('Painting the sky…', 6);
  const sunDir = V(-0.45, 0.14, -0.88).normalize();
  const sky = new T.Mesh(
    new T.SphereGeometry(560, 40, 20),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { s: { value: sunDir } },
      vertexShader:
        'varying vec3 d;void main(){d=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'varying vec3 d;uniform vec3 s;float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=vec2(dot(p,p+45.32));return fract(p.x*p.y);}float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}void main(){vec3 n=normalize(d);float h=n.y;vec3 hz=vec3(.88,.7,.54),mid=vec3(.5,.58,.62),top=vec3(.08,.17,.27);vec3 c=mix(hz,mid,smoothstep(0.,.24,h));c=mix(c,top,smoothstep(.18,.9,h));c=mix(c,hz*.8,smoothstep(0.,-.3,h));c=mix(c,vec3(.92,.8,.64),.4*exp(-pow(max(h,0.)*8.,2.)));if(h>.015){vec2 q=n.xz/(h+.12);float cl=n2(q*.32)*.62+n2(q*.85+3.1)*.3+n2(q*1.9+7.7)*.12;cl=smoothstep(.62,.9,cl)*smoothstep(0.,.05,h)*exp(-h*1.9);c=mix(c,vec3(.94,.91,.88),cl*.45);}float k=max(dot(n,s),0.);c+=vec3(1.,.72,.42)*(pow(k,700.)*3.+pow(k,14.)*.5);gl_FragColor=vec4(c,1.);}',
    }),
  );
  scene.add(sky);
  scene.add(new T.HemisphereLight(C(0xcfe2ea), C(0x4a6d3c), 1.6));
  const sun = new T.DirectionalLight(C(0xffc793), 1.95);
  sun.position.copy(sunDir).multiplyScalar(190);
  if (!lo) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sh = sun.shadow.camera;
    sh.left = -170;
    sh.right = 170;
    sh.top = 170;
    sh.bottom = -170;
    sh.near = 20;
    sh.far = 420;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.5;
  }
  scene.add(sun);
  const pm = new T.PMREMGenerator(renderer),
    es = new T.Scene();
  es.add(sky.clone());
  scene.environment = pm.fromScene(es).texture;
  // ---- distant ridgelines: atmospheric layers behind the playable terrain ----
  await step('Raising the ridgelines…', 12);
  [
    [380, 120, 0.42, 0x41555c, 0],
    [470, 175, 0.6, 0x4a5f63, 9],
  ].forEach(([R, H, MIX, col, sd]) => {
    const g = new T.CylinderGeometry(R, R, H, 72, 1, true),
      p = g.attributes.position,
      c3 = new Float32Array(p.count * 3),
      base = new T.Color(col).convertSRGBToLinear(),
      haze = new T.Color(0xb9aa99).convertSRGBToLinear(),
      tc2 = new T.Color();
    for (let i = 0; i < p.count; i++) {
      const top = p.getY(i) > 0,
        a = Math.atan2(p.getZ(i), p.getX(i)),
        n = fbm(Math.cos(a) * 2.6 + sd, Math.sin(a) * 2.6 + sd);
      p.setY(i, top ? H * (0.28 + 0.9 * n) : -60);
      const yn = Math.min(1, Math.max(0, (p.getY(i) + 60) / (H * 1.3 + 60)));
      tc2.copy(base).lerp(haze, MIX + 0.22 * (1 - yn));
      tc2.toArray(c3, i * 3);
    }
    g.setAttribute('color', new T.BufferAttribute(c3, 3));
    scene.add(
      new T.Mesh(
        g,
        new T.MeshBasicMaterial({
          vertexColors: true,
          side: T.BackSide,
          fog: false,
          depthWrite: false,
        }),
      ),
    );
  });
  const cc = document.createElement('canvas');
  cc.width = cc.height = 128;
  const cx = cc.getContext('2d'),
    gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,230,200,.9)');
  gr.addColorStop(1, 'rgba(255,230,200,0)');
  cx.fillStyle = gr;
  cx.fillRect(0, 0, 128, 128);
  const ctex = new T.CanvasTexture(cc),
    mist = [];
  for (let i = 0; i < (lo ? 8 : 16); i++) {
    const s = new T.Sprite(
        new T.SpriteMaterial({
          map: ctex,
          color: C(0xf0d8bc),
          opacity: 0.05 + Math.random() * 0.05,
          depthWrite: false,
        }),
      ),
      k = 55 + Math.random() * 60;
    s.scale.set(k * 1.7, k * 0.5, 1);
    s.position.set(
      (Math.random() - 0.5) * 260,
      -2 + Math.random() * 16,
      (Math.random() - 0.5) * 140,
    );
    scene.add(s);
    mist.push(s);
  }
  const envUpdate = (dt) => {
    if (reduce) return;
    mist.forEach((m, i) => {
      m.position.x += dt * (0.6 + (i % 3) * 0.24);
      if (m.position.x > 140) m.position.x = -140;
    });
  };

  return { sky, sun, sunDir, pm, fogC, ctex, mist, envUpdate };
}
