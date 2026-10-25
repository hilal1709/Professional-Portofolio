import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  IcosahedronGeometry,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
  type Material,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Pembantu geometri low-poly: tiap bentuk diberi warna per-vertex lalu digabung (merge)
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

/** Kumpulan bentuk berwarna yang nantinya digabung jadi satu geometri. */
export class Parts {
  private list: BufferGeometry[] = [];

  add(geo: BufferGeometry, color: string | Color, t: Xf = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    g.deleteAttribute("uv");
    g.applyMatrix4(matrixOf(t));
    const c = color instanceof Color ? color : new Color(color);
    const count = g.attributes.position.count;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new BufferAttribute(arr, 3));
    this.list.push(g);
    return this;
  }

  box(w: number, h: number, d: number, color: string, t: Xf = {}) {
    return this.add(new BoxGeometry(w, h, d), color, t);
  }
  cyl(rTop: number, rBottom: number, h: number, color: string, t: Xf = {}, seg = 10) {
    return this.add(new CylinderGeometry(rTop, rBottom, h, seg), color, t);
  }
  cone(r: number, h: number, color: string, t: Xf = {}, seg = 6) {
    return this.add(new ConeGeometry(r, h, seg), color, t);
  }
  ico(r: number, color: string | Color, t: Xf = {}, detail = 0) {
    return this.add(new IcosahedronGeometry(r, detail), color, t);
  }
  dome(r: number, color: string, t: Xf = {}) {
    return this.add(new SphereGeometry(r, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), color, t);
  }

  get size() {
    return this.list.length;
  }

  mesh(material: Material) {
    const merged = mergeGeometries(this.list, false)!;
    this.list.forEach((g) => g.dispose());
    this.list = [];
    merged.computeBoundingSphere();
    const mesh = new Mesh(merged, material);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    return mesh;
  }
}

/** Material bersama: Lambert + flat shading + warna per-vertex (sangat murah). */
export function lowPolyMaterial(side?: Material["side"]) {
  return new MeshLambertMaterial({ vertexColors: true, flatShading: true, ...(side !== undefined ? { side } : {}) });
}

/** Acak deterministik — dunia sama di setiap kunjungan. */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
