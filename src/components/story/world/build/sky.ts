import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  FogExp2,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  Points,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type Scene,
} from "three";
import type { skyState } from "../rig";
import { seeded, sharedTime } from "../geo";

type Sky = typeof skyState;

const VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

// Gradien 3 warna (cakrawala berkabut → tengah → zenit), halo matahari lebar + piringan terang (bloom).
const FRAG = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uSun;
uniform vec3 uSunDir;
uniform float uSunO;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 mid = mix(uBottom, uTop, 0.45);
  vec3 col = mix(uBottom, mid, smoothstep(-0.05, 0.18, h));
  col = mix(col, uTop, smoothstep(0.15, 0.75, h));
  col = mix(col, uBottom * 1.06, (1.0 - smoothstep(0.0, 0.08, abs(h))) * 0.5);
  float s = max(dot(d, uSunDir), 0.0);
  col += uSun * uSunO * (pow(s, 6.0) * 0.18 + pow(s, 64.0) * 0.5);
  col += uSun * uSunO * smoothstep(0.9982, 0.9991, s) * 2.6;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const STAR_VERT = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uSize;
varying float vTw;
void main() {
  vTw = 0.55 + 0.45 * sin(uTime * (1.2 + aSeed * 2.0) + aSeed * 40.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * (0.6 + aSeed * 0.9);
  gl_Position = projectionMatrix * mv;
}`;

const STAR_FRAG = /* glsl */ `
uniform float uOpacity;
varying float vTw;
void main() {
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, r);
  gl_FragColor = vec4(vec3(1.0, 0.97, 0.9) * 1.6, a * vTw * uOpacity);
}`;

/** Kubah langit, bintang berkelip, bulan bercahaya, cahaya matahari + langit, dan kabut atmosfer. */
export function buildSky(scene: Scene, mobile: boolean) {
  const group = new Group();
  const uniforms = {
    uTop: { value: new Color() },
    uBottom: { value: new Color() },
    uSun: { value: new Color() },
    uSunDir: { value: new Vector3(0, 0.3, -1).normalize() },
    uSunO: { value: 1 },
  };
  const dome = new Mesh(new SphereGeometry(500, 48, 24), new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, side: BackSide, depthWrite: false }));
  dome.renderOrder = -2;
  dome.frustumCulled = false;
  group.add(dome);

  const rand = seeded(7);
  const count = mobile ? 420 : 800;
  const pos = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const y = 0.06 + rand() * 0.94;
    const r = Math.sqrt(1 - y * y);
    pos.set([Math.cos(a) * r * 450, y * 450, Math.sin(a) * r * 450], i * 3);
    seeds[i] = rand();
  }
  const starGeo = new BufferGeometry();
  starGeo.setAttribute("position", new BufferAttribute(pos, 3));
  starGeo.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  const starMat = new ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    uniforms: { uTime: sharedTime, uOpacity: { value: 0 }, uSize: { value: (mobile ? 3 : 4) * Math.min(window.devicePixelRatio || 1, 2) } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const stars = new Points(starGeo, starMat);
  stars.renderOrder = -1;
  stars.frustumCulled = false;
  group.add(stars);

  const moonMat = new MeshBasicMaterial({ color: new Color("#fff4dc").multiplyScalar(1.8), transparent: true, opacity: 0, depthWrite: false, fog: false });
  const moon = new Mesh(new SphereGeometry(14, 32, 24), moonMat);
  moon.position.set(-90, 330, -300);
  moon.renderOrder = -1;
  group.add(moon);
  scene.add(group);

  const hemi = new HemisphereLight("#fff4e2", "#7d9c66", 1.1);
  const sun = new DirectionalLight("#fff1d6", 2.6);
  scene.add(hemi, sun, sun.target);
  scene.fog = new FogExp2("#f9e7c8", 0.0042);

  const tmp = new Color();
  const night = new Color("#1a2150");
  /** Arah datang cahaya matahari (dipakai engine untuk memposisikan lampu & kamera bayangan). */
  const lightDir = new Vector3(-0.4, 0.6, 0.7).normalize();
  let lastKey = "";

  return {
    sun,
    lightDir,
    /** true bila palet berubah (bayangan perlu diperbarui). */
    update(s: Sky, camPos: Vector3) {
      group.position.copy(camPos);
      const key = `${s.top}|${s.bottom}|${s.sun}|${s.sunX}|${s.sunY}|${s.sunO}|${s.stars}|${s.moon}`;
      if (key === lastKey) return false;
      lastKey = key;
      uniforms.uTop.value.setStyle(s.top);
      uniforms.uBottom.value.setStyle(s.bottom);
      uniforms.uSun.value.setStyle(s.sun);
      uniforms.uSunO.value = s.sunO;
      const az = ((s.sunX - 50) / 50) * 0.7;
      const el = ((70 - s.sunY) * 0.9 * Math.PI) / 180;
      uniforms.uSunDir.value.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
      starMat.uniforms.uOpacity.value = s.stars;
      moonMat.opacity = s.moon;
      moon.visible = s.moon > 0.01;
      stars.visible = s.stars > 0.01;

      (scene.fog as FogExp2).color.setStyle(s.bottom);
      const dark = s.stars;
      hemi.color.copy(uniforms.uTop.value).lerp(tmp.set("#fff4e2"), 0.65);
      hemi.groundColor.set("#7d9c66").lerp(night, dark);
      hemi.intensity = 1.1 - dark * 0.55;
      sun.color.setStyle(s.sun).lerp(tmp.set("#ffffff"), 0.45);
      sun.intensity = 2.6 * Math.max(0.12, s.sunO) * (1 - dark * 0.7);
      // Cahaya dari sisi matahari tapi sedikit dari depan, supaya fasad yang menghadap kamera tidak gelap.
      const d = uniforms.uSunDir.value;
      lightDir.set(d.x, Math.max(d.y, 0.45), 0.75).normalize();
      return true;
    },
    dispose() {
      dome.geometry.dispose();
      (dome.material as ShaderMaterial).dispose();
      starGeo.dispose();
      starMat.dispose();
      moon.geometry.dispose();
      moonMat.dispose();
    },
  };
}
