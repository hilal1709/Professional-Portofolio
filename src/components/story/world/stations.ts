import type { SceneKey } from "../stage/sceneStore";
import { REST_DISTANCE, type Pose, type Vec3 } from "./rig";

/**
 * Letak tiap babak di dunia 3D: panel DOM babak menempel pada bidang ini.
 * `yaw` memutar bidang di sumbu Y (0 = menghadap +z), `pitch` memiringkannya (positif = menghadap ke bawah).
 * Kamera diam tepat di depan bidang sejauh REST_DISTANCE sehingga panel tampil 1:1.
 */
export type Station = { c: Vec3; yaw: number; pitch: number };

const EYE = 7;

export const STATIONS: Record<SceneKey, Station> = {
  // Sedikit lebih tinggi supaya kota berada di bawah judul.
  hero: { c: { x: 0, y: 9.5, z: 0 }, yaw: 0, pitch: 0 },
  // Ruang di dalam gedung kampus (pintu di x = 4, z = -30).
  about: { c: { x: 4, y: EYE, z: -53 }, yaw: 0, pitch: 0 },
  // Jalan siang, membentang ke arah +x.
  journey: { c: { x: 0, y: EYE, z: -120 }, yaw: 0, pitch: 0 },
  // Di dalam ransel.
  skills: { c: { x: 0, y: EYE, z: -200 }, yaw: 0, pitch: 0 },
  // Galeri sore menghadap +x; track proyek bergeser ke arah -z.
  projects: { c: { x: 60, y: EYE, z: -260 }, yaw: Math.PI / 2, pitch: 0 },
  // Reel tumbuh dari kartu proyek terakhir, jadi berbagi bidang yang sama.
  reel: { c: { x: 60, y: EYE, z: -260 }, yaw: Math.PI / 2, pitch: 0 },
  experience: { c: { x: 95, y: EYE, z: -300 }, yaw: 0, pitch: 0 },
  // Langit malam: panel menghadap ke bawah, kamera mendongak.
  contact: { c: { x: 95, y: 30, z: -330 }, yaw: 0, pitch: (55 * Math.PI) / 180 },
};

/** Arah normal bidang (ke arah kamera). */
export function normalOf(s: Station): Vec3 {
  const cp = Math.cos(s.pitch);
  return { x: Math.sin(s.yaw) * cp, y: -Math.sin(s.pitch), z: Math.cos(s.yaw) * cp };
}

/** Arah "kanan" bidang (sumbu x panel di dunia). */
export function rightOf(s: Station): Vec3 {
  return { x: Math.cos(s.yaw), y: 0, z: -Math.sin(s.yaw) };
}

export function restPose(key: SceneKey): Pose {
  const s = STATIONS[key];
  const n = normalOf(s);
  return {
    px: s.c.x + n.x * REST_DISTANCE,
    py: s.c.y + n.y * REST_DISTANCE,
    pz: s.c.z + n.z * REST_DISTANCE,
    tx: s.c.x,
    ty: s.c.y,
    tz: s.c.z,
  };
}

/** Titik-titik penting di dunia (dipakai transisi kamera & pembangun dunia). */
export const POINTS = {
  /** Pintu gedung kampus UISI (tengah daun pintu). */
  door: { x: 4, y: 1.9, z: -30 },
  campus: { x: 4, z: -44, w: 24, h: 9, d: 28 },
  backpack: { x: 0, y: EYE, z: -200, r: 16 },
};

/** Zona dunia WebGL yang perlu digambar untuk tiap babak (sisanya disembunyikan). */
export type Zone = "city" | "room" | "road" | "pack" | "gallery" | "dusk" | "night";

export const ZONES: Record<SceneKey, Zone[]> = {
  hero: ["city"],
  about: ["room", "city"],
  journey: ["road", "city"],
  skills: ["pack"],
  projects: ["gallery"],
  reel: ["gallery"],
  experience: ["dusk", "gallery"],
  contact: ["night", "dusk"],
};
