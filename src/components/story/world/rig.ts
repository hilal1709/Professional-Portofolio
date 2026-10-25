/**
 * State kamera & langit bersama untuk dunia 3D.
 * Hanya objek angka/warna biasa (tanpa three) — GSAP men-tween nilainya, sedangkan
 * renderer CSS3D (panel babak) dan WebGL (dunia) cukup membacanya tiap frame.
 * Satuan dunia: 1 = ±1 meter. Lantai di y = 0.
 */

export type Vec3 = { x: number; y: number; z: number };

export const rig = {
  // Posisi & titik tatap kamera — dipakai bersama oleh panel DOM dan dunia WebGL.
  px: 0,
  py: 7,
  pz: 10,
  tx: 0,
  ty: 7,
  tz: 0,
  // Geseran khusus dunia WebGL (parallax saat track DOM bergeser, intro turun dari langit).
  dx: 0,
  dy: 0,
  dz: 0,
};

export type Rig = typeof rig;

/** Pose kamera (posisi + titik tatap). */
export type Pose = Pick<Rig, "px" | "py" | "pz" | "tx" | "ty" | "tz">;

/** Bidang pandang vertikal kamera (derajat) — sama untuk CSS3D & WebGL agar keduanya sejajar. */
export const FOV = 50;

/** Jarak kamera ke panel saat diam: panel tampil 1:1 (teks tajam, layout sama seperti 2D). */
export const REST_DISTANCE = 10;

/** Piksel CSS per satuan dunia, bergantung tinggi layar. */
export function pxPerUnit(vh: number) {
  return vh / 2 / Math.tan((FOV * Math.PI) / 360) / REST_DISTANCE;
}

/** Palet langit yang sedang tampil (di-tween SkyBackdrop, dibaca kubah langit WebGL). */
export const skyState = {
  top: "#9fd0ef",
  bottom: "#f9e7c8",
  sun: "#ffd36b",
  sunX: 18,
  sunY: 34,
  sunO: 1,
  stars: 0,
  moon: 0,
  clouds: 1,
};

/** Nama event yang dipancarkan saat dunia WebGL selesai dibangun / preloader ditutup. */
export const WORLD_READY = "world:ready";
export const PRELOADER_DONE = "preloader:done";

/** Status dunia & preloader, supaya komponen yang terlambat dipasang tetap tahu. */
export const worldFlags = { ready: false, failed: false, preloaderDone: false };

export function onPreloaderDone(cb: () => void) {
  if (worldFlags.preloaderDone) {
    cb();
    return () => {};
  }
  window.addEventListener(PRELOADER_DONE, cb, { once: true });
  return () => window.removeEventListener(PRELOADER_DONE, cb);
}
