import type gsap from "gsap";
import type { Pose } from "../world/rig";
import type { SceneKey } from "./sceneStore";

/** Data bersama antar-adegan saat timeline dibangun (mis. posisi kartu proyek terakhir untuk transisi ke Reel). */
export type SharedBag = {
  packPoint?: { x: number; y: number };
  lastCardRect?: DOMRect;
  reelFrameRect?: DOMRect;
};

export type SceneCtx = {
  /** Elemen lapisan adegan ini. */
  el: HTMLElement;
  /** Panggung (berisi semua adegan + lanskap kamera). */
  stage: HTMLElement;
  /** Lapisan adegan sebelumnya (untuk transisi), jika ada. */
  prev: HTMLElement | null;
  mobile: boolean;
  vw: number;
  vh: number;
  shared: SharedBag;
  /** Bingkai depan "gerbang": tambahkan efek kamera menembus bingkai di posisi tertentu. */
  passThrough: (at: number, dur?: number) => void;
  /** Piksel CSS per satuan dunia 3D (untuk menyamakan geseran DOM dengan parallax dunia). */
  S: number;
  /**
   * Terbangkan kamera 3D ke pose babak (`key`) atau pose bebas mulai `at` selama `dur`.
   * `via` = titik tengah lintasan (sebagian sumbu saja boleh), misalnya `{ py: 22 }` untuk naik dulu.
   */
  fly: (at: number, to: SceneKey | Pose, dur: number, opts?: { ease?: string; via?: Partial<Pose> }) => void;
  /** Geser kamera dunia WebGL saja (parallax), tanpa menggeser panel DOM. */
  drift: (at: number, to: { dx?: number; dy?: number; dz?: number }, dur: number, ease?: string) => void;
};

/**
 * Pembangun animasi satu adegan.
 * Menambahkan tween ke `tl` mulai dari `start` (satuan: 1 = 100vh scroll) dan mengembalikan panjangnya.
 * Satu satuan terakhir adalah jendela keluar, yang tumpang-tindih dengan jendela masuk adegan berikutnya.
 */
export type SceneBuild = (tl: gsap.core.Timeline, start: number, ctx: SceneCtx) => number;

export type SceneEntry = { key: SceneKey; build: SceneBuild };

/** Lama tumpang-tindih transisi antar-adegan (dalam satuan). */
export const OVERLAP = 1;
