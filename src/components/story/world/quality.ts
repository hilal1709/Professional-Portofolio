/**
 * Tier kualitas dunia 3D. Dipilih dari kemampuan perangkat saat start,
 * lalu bisa diturunkan bertahap saat runtime bila frame terasa berat.
 */
export type Quality = {
  tier: "high" | "medium" | "low";
  dpr: number;
  /** Ukuran shadow map (0 = tanpa bayangan). */
  shadow: number;
  /** Post-processing (bloom, vignette, tone mapping, MSAA). */
  post: boolean;
  msaa: number;
  /** Jumlah helai rumput per zona. */
  grass: number;
  mobile: boolean;
};

export function pickQuality(): Quality {
  const dpr = window.devicePixelRatio || 1;
  const mobile = window.innerWidth < 768 || matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (!mobile && cores >= 6 && memory >= 4) return { tier: "high", dpr: Math.min(dpr, 2), shadow: 2048, post: true, msaa: 4, grass: 9000, mobile };
  if (cores >= 4 && memory >= 3) return { tier: "medium", dpr: Math.min(dpr, mobile ? 1.5 : 1.75), shadow: 1024, post: true, msaa: 2, grass: 4000, mobile };
  return { tier: "low", dpr: Math.min(dpr, 1.25), shadow: 0, post: false, msaa: 0, grass: 0, mobile };
}

/** Langkah penurunan kualitas berikutnya; null bila sudah paling rendah. */
export function degrade(q: Quality): Quality | null {
  if (q.post) return { ...q, post: false };
  if (q.shadow) return { ...q, shadow: 0 };
  if (q.dpr > 1) return { ...q, dpr: Math.max(1, q.dpr - 0.25) };
  if (q.dpr > 0.75) return { ...q, dpr: 0.75 };
  return null;
}
