import { FOV, pxPerUnit, REST_DISTANCE, type Rig, type Vec3 } from "./rig";
import { normalOf, type Station } from "./stations";

/**
 * Renderer CSS3D mini (diadaptasi dari three/examples CSS3DRenderer, tanpa memindahkan node React):
 * `view` memberi perspective, `cam` (preserve-3d) membawa matriks kamera, dan tiap panel babak
 * ditempel di bidang stasiunnya. Tidak butuh WebGL, jadi tetap jalan saat dunia 3D gagal dimuat.
 */

type Item = { el: HTMLElement; station: Station };

const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};
// Hindari notasi eksponen (1e-7) yang tidak valid di matrix3d.
const n = (v: number) => (Math.abs(v) < 1e-10 ? 0 : +v.toFixed(6));

/** Sumbu kamera (x kanan, y atas, z ke belakang) untuk pose `rig`. */
export function cameraBasis(p: Vec3, t: Vec3) {
  const z = norm(sub(p, t));
  let x = cross({ x: 0, y: 1, z: 0 }, z);
  if (Math.hypot(x.x, x.y, x.z) < 1e-6) x = { x: 1, y: 0, z: 0 };
  x = norm(x);
  return { x, y: cross(z, x), z };
}

export function createCss3d(view: HTMLElement, cam: HTMLElement, items: Item[]) {
  let flat = true;
  let w = 0;
  let h = 0;
  let S = 1;
  let persp = 1;
  let last = "";
  const hidden = new Map<HTMLElement, boolean>();

  const placeItems = () => {
    for (const { el, station } of items) {
      if (flat) {
        el.style.transform = "";
        continue;
      }
      const cy = Math.cos(station.yaw);
      const sy = Math.sin(station.yaw);
      const cp = Math.cos(station.pitch);
      const sp = Math.sin(station.pitch);
      const e = [cy, 0, -sy, 0, sy * sp, cp, cy * sp, 0, sy * cp, -sp, cy * cp, 0, station.c.x * S, station.c.y * S, station.c.z * S, 1];
      el.style.transform = `translate(-50%,-50%) matrix3d(${[e[0], e[1], e[2], e[3], -e[4], -e[5], -e[6], -e[7], e[8], e[9], e[10], e[11], e[12], e[13], e[14], e[15]].map(n).join(",")})`;
    }
  };

  const setVisible = (el: HTMLElement, show: boolean) => {
    if (hidden.get(el) === !show) return;
    hidden.set(el, !show);
    el.style.opacity = show ? "" : "0";
  };

  return {
    setSize(width: number, height: number) {
      w = width;
      h = height;
      S = pxPerUnit(h);
      persp = S * REST_DISTANCE;
      cam.style.width = `${w}px`;
      cam.style.height = `${h}px`;
      last = "";
      placeItems();
    },
    /** Mode datar: tanpa transform 3D sama sekali (untuk mengukur layout saat timeline dibangun). */
    setFlat(value: boolean) {
      flat = value;
      last = "";
      view.style.perspective = flat ? "" : `${persp}px`;
      cam.style.transform = "";
      cam.classList.toggle("cam3d-on", !flat);
      if (flat) items.forEach(({ el }) => setVisible(el, true));
      placeItems();
    },
    update(r: Rig) {
      if (flat || !w) return;
      const key = `${r.px},${r.py},${r.pz},${r.tx},${r.ty},${r.tz}`;
      if (key === last) return;
      last = key;
      const p = { x: r.px, y: r.py, z: r.pz };
      const b = cameraBasis(p, { x: r.tx, y: r.ty, z: r.tz });
      const ps = { x: p.x * S, y: p.y * S, z: p.z * S };
      // Matriks view (dunia → kamera), kolom-mayor, dengan sumbu y dibalik untuk CSS.
      const e = [b.x.x, b.y.x, b.z.x, 0, b.x.y, b.y.y, b.z.y, 0, b.x.z, b.y.z, b.z.z, 0, -dot(b.x, ps), -dot(b.y, ps), -dot(b.z, ps), 1];
      const m = [e[0], -e[1], e[2], e[3], e[4], -e[5], e[6], e[7], e[8], -e[9], e[10], e[11], e[12], -e[13], e[14], e[15]].map(n).join(",");
      cam.style.transform = `translateZ(${n(persp)}px) matrix3d(${m}) translate(${w / 2}px,${h / 2}px)`;

      // Panel yang di belakang kamera / terlalu dekat / membelakangi kamera disembunyikan
      // (CSS tidak memotong bidang di near plane, jadi tanpa ini panel bisa "meledak" memenuhi layar).
      for (const { el, station } of items) {
        const rel = sub(station.c, p);
        const depth = -dot(b.z, rel);
        const facing = dot(normalOf(station), rel) < 0;
        setVisible(el, facing && depth > REST_DISTANCE * 0.18 && depth < REST_DISTANCE * 40);
      }
    },
    get scale() {
      return S;
    },
  };
}

export type Css3d = ReturnType<typeof createCss3d>;

/** Proyeksikan titik dunia ke koordinat layar (px, relatif kiri-atas panggung) untuk pose kamera tertentu. */
export function projectPoint(pt: Vec3, pose: { px: number; py: number; pz: number; tx: number; ty: number; tz: number }, vw: number, vh: number) {
  const p = { x: pose.px, y: pose.py, z: pose.pz };
  const b = cameraBasis(p, { x: pose.tx, y: pose.ty, z: pose.tz });
  const rel = sub(pt, p);
  const depth = -dot(b.z, rel);
  const f = vh / 2 / Math.tan((FOV * Math.PI) / 360);
  return { x: vw / 2 + (dot(b.x, rel) / depth) * f, y: vh / 2 - (dot(b.y, rel) / depth) * f };
}
