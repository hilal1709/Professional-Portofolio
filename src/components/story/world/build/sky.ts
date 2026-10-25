import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type Scene,
} from "three";
import type { skyState } from "../rig";
import { seeded } from "../geo";

type Sky = typeof skyState;

const VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const FRAG = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uSun;
uniform vec3 uSunDir;
uniform float uSunO;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  vec3 col = mix(uBottom, uTop, smoothstep(-0.04, 0.6, d.y));
  float s = max(dot(d, uSunDir), 0.0);
  col += uSun * uSunO * (smoothstep(0.9975, 0.9985, s) + pow(s, 48.0) * 0.45);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

/** Kubah langit (gradien + matahari di shader), bintang, bulan, cahaya & kabut yang mengikuti palet. */
export function buildSky(scene: Scene, mobile: boolean) {
  const group = new Group();
  const uniforms = {
    uTop: { value: new Color() },
    uBottom: { value: new Color() },
    uSun: { value: new Color() },
    uSunDir: { value: new Vector3(0, 0.3, -1).normalize() },
    uSunO: { value: 1 },
  };
  const dome = new Mesh(
    new SphereGeometry(500, 24, 12),
    new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, side: BackSide, depthWrite: false, fog: false }),
  );
  dome.renderOrder = -2;
  dome.frustumCulled = false;
  group.add(dome);

  // Bintang: satu draw call.
  const rand = seeded(7);
  const count = mobile ? 380 : 700;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const y = 0.08 + rand() * 0.92;
    const r = Math.sqrt(1 - y * y);
    pos.set([Math.cos(a) * r * 450, y * 450, Math.sin(a) * r * 450], i * 3);
  }
  const starGeo = new BufferGeometry();
  starGeo.setAttribute("position", new BufferAttribute(pos, 3));
  const starMat = new PointsMaterial({ color: "#fff8e6", size: mobile ? 1.6 : 2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const stars = new Points(starGeo, starMat);
  stars.renderOrder = -1;
  stars.frustumCulled = false;
  group.add(stars);

  const moonMat = new MeshBasicMaterial({ color: "#f3ead2", transparent: true, opacity: 0, depthWrite: false, fog: false });
  const moon = new Mesh(new SphereGeometry(14, 16, 12), moonMat);
  moon.position.set(-90, 330, -300);
  moon.renderOrder = -1;
  group.add(moon);
  scene.add(group);

  const hemi = new HemisphereLight("#cfe6f5", "#6f8f5a", 2.4);
  const sun = new DirectionalLight("#fff1d6", 2.2);
  sun.position.set(-40, 60, 30);
  scene.add(hemi, sun);
  scene.fog = new Fog("#f9e7c8", 70, 420);

  const tmp = new Color();
  const night = new Color("#1a2150");
  let lastKey = "";

  return {
    update(s: Sky, camPos: Vector3) {
      group.position.copy(camPos);
      const key = `${s.top}|${s.bottom}|${s.sun}|${s.sunX}|${s.sunY}|${s.sunO}|${s.stars}|${s.moon}`;
      if (key === lastKey) return;
      lastKey = key;
      uniforms.uTop.value.setStyle(s.top);
      uniforms.uBottom.value.setStyle(s.bottom);
      uniforms.uSun.value.setStyle(s.sun);
      uniforms.uSunO.value = s.sunO;
      // sunX/sunY (persen layar di versi 2D) → azimut & elevasi matahari di dunia.
      const az = ((s.sunX - 50) / 50) * 0.7;
      const el = ((70 - s.sunY) * 0.9 * Math.PI) / 180;
      uniforms.uSunDir.value.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
      starMat.opacity = s.stars;
      moonMat.opacity = s.moon;
      moon.visible = s.moon > 0.01;
      stars.visible = s.stars > 0.01;

      (scene.fog as Fog).color.setStyle(s.bottom);
      const dark = s.stars;
      hemi.color.copy(uniforms.uTop.value).lerp(tmp.set("#fff4e2"), 0.7);
      hemi.groundColor.set("#6f8f5a").lerp(night, dark);
      hemi.intensity = 2.4 - dark * 1.3;
      sun.color.setStyle(s.sun).lerp(tmp.set("#ffffff"), 0.35);
      sun.intensity = 2.2 * Math.max(0.15, s.sunO) * (1 - dark * 0.6);
      // Cahaya datang dari sisi matahari tapi sedikit dari depan, supaya fasad yang menghadap kamera tidak gelap.
      const d = uniforms.uSunDir.value;
      sun.position.set(d.x * 100, Math.max(d.y * 100, 25), 70);
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
