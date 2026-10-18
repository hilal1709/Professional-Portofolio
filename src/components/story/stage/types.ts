import type gsap from "gsap";
import type { SceneKey } from "./sceneStore";

/** Data bersama antar-adegan saat timeline dibangun (mis. posisi kartu proyek terakhir untuk transisi ke Reel). */
export type SharedBag = {
  doorPoint?: { x: number; y: number };
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
