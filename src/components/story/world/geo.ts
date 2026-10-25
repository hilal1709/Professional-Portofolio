import {
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Euler,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
  type Material,
  type Side,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Pembantu geometri stylized: bentuk halus & membulat diberi warna per-vertex lalu digabung
 * menjadi satu mesh per zona → sedikit draw call, tanpa tekstur.
 */

export type Xf = { x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; sx?: number; sy?: number; sz?: number };

const _m = new Matrix4();
const _q = new Quaternion();
const _e = new Euler();
const _p = new Vector3();
const _s = new Vector3();

export function matrixOf(t: Xf, out = _m) {
  _e.set(t.rx ?? 0, t.ry ?? 0, t.rz ?? 0);
  _q.setFromEuler(_e);
  _p.set(t.x ?? 0, t.y ?? 0, t.z ?? 0);
  _s.set(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1);
  return out.compose(_p, _q, _s);
}

/** Warnai seluruh vertex geometri dengan satu warna (atribut `color`). */
export function paint(g: BufferGeometry, color: string | Color) {
  const c = color instanceof Color ? color : new Color(color);
  const count = g.attributes.position.count;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) arr.set([c.r, c.g, c.b], i * 3);
  g.setAttribute("color", new BufferAttribute(arr, 3));
  return g;
}

/** Kumpulan bentuk berwarna yang nantinya digabung jadi satu geometri. */
export class Parts {
  private list: BufferGeometry[] = [];

  add(geo: BufferGeometry, color: string | Color, t: Xf = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    g.deleteAttribute("uv");
    g.applyMatrix4(matrixOf(t));
    paint(g, color);
    this.list.push(g);
    return this;
  }

  /** Kotak dengan sudut membulat (radius otomatis mengikuti sisi terpendek). */
  box(w: number, h: number, d: number, color: string, t: Xf = {}, radius?: number) {
    const r = radius ?? Math.min(0.35, Math.min(w, h, d) * 0.18);
    return this.add(new RoundedBoxGeometry(w, h, d, 2, Math.max(0.001, r)), color, t);
  }
  cyl(rTop: number, rBottom: number, h: number, color: string, t: Xf = {}, seg = 24) {
    return this.add(new CylinderGeometry(rTop, rBottom, h, seg), color, t);
  }
  cone(r: number, h: number, color: string, t: Xf = {}, seg = 24) {
    return this.add(new CylinderGeometry(0, r, h, seg), color, t);
  }
  ball(r: number, color: string | Color, t: Xf = {}, w = 20, h = 14) {
    return this.add(new SphereGeometry(r, w, h), color, t);
  }
  dome(r: number, color: string, t: Xf = {}) {
    return this.add(new SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), color, t);
  }

  get size() {
    return this.list.length;
  }

  /** Gabungkan semua bentuk menjadi satu geometri (kumpulan dikosongkan). */
  geometry() {
    const merged = mergeGeometries(this.list, false)!;
    this.list.forEach((g) => g.dispose());
    this.list = [];
    merged.computeBoundingSphere();
    return merged;
  }

  mesh(material: Material, shadows = true) {
    const mesh = new Mesh(this.geometry(), material);
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    return mesh;
  }
}

/** Uniform waktu bersama untuk semua material yang bergoyang (angin, air). */
export const sharedTime = { value: 0 };

type StylizedOpts = { side?: Side; wind?: number; emissive?: string; emissiveIntensity?: number };

/**
 * Material stylized lembut: PBR kasar + warna per-vertex, ditambah
 * AO palsu di kaki objek (makin dekat tanah makin gelap), rim light hangat,
 * dan (opsional) goyangan angin di vertex — bagus untuk dedaunan & rumput.
 */
export function stylizedMaterial({ side, wind = 0, emissive, emissiveIntensity }: StylizedOpts = {}) {
  const mat = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0,
    ...(side !== undefined ? { side } : {}),
    ...(emissive ? { emissive, emissiveIntensity: emissiveIntensity ?? 1 } : {}),
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = sharedTime;
    shader.uniforms.uWind = { value: wind };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;\nuniform float uWind;\nvarying float vWorldY;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 basePos = instanceMatrix[3].xyz;
        #else
          vec3 basePos = modelMatrix[3].xyz;
        #endif
        float sway = uWind * max(position.y, 0.0);
        transformed.x += sin(uTime * 1.6 + basePos.x * 0.35 + basePos.z * 0.2) * sway;
        transformed.z += cos(uTime * 1.3 + basePos.z * 0.3) * sway * 0.6;`,
      )
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
        vec4 wp = modelMatrix * vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        #endif
        vWorldY = wp.y;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vWorldY;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        diffuseColor.rgb *= mix(0.68, 1.0, smoothstep(0.0, 1.6, vWorldY));`,
      )
      .replace(
        "#include <opaque_fragment>",
        `float rim = pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 3.0);
        outgoingLight += vec3(1.0, 0.86, 0.66) * rim * 0.18;
        #include <opaque_fragment>`,
      );
  };
  // Kunci cache program berbeda per konfigurasi angin.
  mat.customProgramCacheKey = () => `stylized-${wind}`;
  return mat;
}

/** Acak deterministik — dunia sama di setiap kunjungan. */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
