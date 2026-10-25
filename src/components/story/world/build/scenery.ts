import { Group, type Material } from "three";
import type { Models } from "../assets";
import { Parts, seeded } from "../geo";
import type { Quality } from "../quality";
import { BUSH_KINDS, FLOWER_KINDS, scatter, TREE_KINDS, type Spot } from "./nature";

/**
 * Latar kota Gresik di sekeliling gedung kampus: desa kecil, petak sawah, hutan di kiri-kanan,
 * dan barisan bukit dekat — supaya hamparan rumput tidak kosong. Hanya di zona "city"
 * (z > -110, sebelum jalan babak Perjalanan di z = -120).
 */
export function buildScenery(mat: Material, foliage: Material, models: Models, q: Quality) {
  const group = new Group();
  const rand = seeded(77);
  const lite = q.mobile;

  // Petak sawah & ladang berwarna di kiri-kanan, lembut seperti patchwork dari kejauhan.
  const fields = new Parts();
  const crops = ["#d9c26b", "#a9c46a", "#e3d28a", "#8fb85f", "#c9b45a", "#b7cf7a"];
  for (const side of [-1, 1]) {
    for (let i = 0; i < (lite ? 7 : 12); i++) {
      const w = 12 + rand() * 20;
      const d = 9 + rand() * 16;
      const x = side * (46 + rand() * 70);
      const z = -16 - rand() * 76;
      fields.box(w, 0.06, d, crops[Math.floor(rand() * crops.length)], { x, y: 0.03, z, ry: (rand() - 0.5) * 0.25 }, 0.03);
    }
  }
  group.add(fields.mesh(mat, false));

  // Desa: rumah-rumah kecil beratap merah/oranye tersebar di belakang & samping kampus.
  const village = new Parts();
  const walls = ["#ecdcc0", "#f1e4cc", "#e3cfae", "#f4eadb"];
  const roofs = ["#c2453b", "#a3191f", "#d9783c", "#b2252b"];
  const houses: Spot[] = [];
  for (let t = 0; houses.length < (lite ? 22 : 40) && t < 600; t++) {
    const x = (rand() - 0.5) * 270;
    const z = -26 - rand() * 66;
    // Kosongkan area kampus/pabrik/masjid (sudah ada) dan jalur kamera Perjalanan.
    if (x > -32 && x < 44 && z > -66) continue;
    if (Math.abs(x) < 16 && z < -82) continue;
    if (houses.some((h) => Math.hypot(h.x - x, h.z - z) < 8)) continue;
    houses.push({ x, z, s: 0.85 + rand() * 0.7 });
  }
  houses.forEach((h, i) => {
    const s = h.s ?? 1;
    const w = 4.4 * s;
    const ry = (rand() - 0.5) * 0.5;
    village.box(w, 3.2 * s, w * 0.9, walls[i % walls.length], { x: h.x, y: 1.6 * s, z: h.z, ry }, 0.25);
    village.cone(w * 0.85, 2.4 * s, roofs[Math.floor(rand() * roofs.length)], { x: h.x, y: 4.4 * s, z: h.z, ry: ry + Math.PI / 4 }, 4);
    if (i % 5 === 0) village.cyl(0.25, 0.25, 1.6 * s, "#a29d95", { x: h.x + w * 0.25, y: 5.2 * s, z: h.z }, 8);
  });
  // Menara air & kincir angin kecil sebagai penanda di kejauhan.
  village.cyl(0.35, 0.35, 11, "#a29d95", { x: -78, y: 5.5, z: -58 }, 12).cyl(2.3, 2.3, 3, "#c4beb5", { x: -78, y: 12.4, z: -58 }, 20).dome(2.3, "#b2252b", { x: -78, y: 13.9, z: -58 });
  village.cyl(0.3, 0.55, 12, "#ecdcc0", { x: 84, y: 6, z: -62 }, 12);
  [0, 1, 2, 3].forEach((k) => village.box(0.45, 8, 0.12, "#f5eee2", { x: 84, y: 12.2, z: -61.4, rz: (k * Math.PI) / 2 + 0.5, sy: 1 }, 0.04));
  group.add(village.mesh(mat));

  // Hutan di kiri-kanan (dekat → rapat, jauh → lebat) + semak & bunga di tepi hutan.
  const forest: Spot[] = [];
  for (let t = 0; forest.length < (lite ? 55 : 120) && t < 1500; t++) {
    const side = rand() > 0.5 ? 1 : -1;
    const x = side * (36 + rand() * 120);
    const z = -12 - rand() * 90;
    if (houses.some((h) => Math.hypot(h.x - x, h.z - z) < 6)) continue;
    // Bukan di atas petak sawah terlalu padat: sisakan celah dengan peluang.
    if (Math.abs(x) < 62 && z > -40 && rand() > 0.35) continue;
    forest.push({ x, z, s: 0.8 + rand() * 0.9 });
  }
  group.add(scatter(models, TREE_KINDS, forest, foliage, { scale: 4.4, seed: 12, shadows: false }));
  const undergrowth: Spot[] = forest.slice(0, lite ? 30 : 70).map((f) => ({ x: f.x + (rand() - 0.5) * 6, z: f.z + 2 + rand() * 4 }));
  group.add(scatter(models, BUSH_KINDS, undergrowth, foliage, { scale: 2.6, seed: 13, shadows: false }));
  const blooms: Spot[] = [];
  for (let i = 0; i < (lite ? 40 : 110); i++) {
    const side = rand() > 0.5 ? 1 : -1;
    blooms.push({ x: side * (22 + rand() * 90), z: -10 - rand() * 60 });
  }
  group.add(scatter(models, FLOWER_KINDS, blooms, foliage, { scale: 2.2, seed: 14, shadows: false }));
  group.add(scatter(models, ["rock_largeA", "rock_smallA", "stone_smallB", "log", "stump_round", "mushroom_red"], forest.slice(0, 26).map((f) => ({ x: f.x + 3, z: f.z + 3 })), mat, { scale: 2.2, seed: 15, shadows: false }));

  // Bingkai depan: pohon & semak di tepi kiri-kanan layar hero, padang bunga di antara jalan dan kamera.
  const frame: Spot[] = [];
  for (let i = 0; i < (lite ? 8 : 16); i++) {
    const side = i % 2 ? 1 : -1;
    frame.push({ x: side * (20 + rand() * 30), z: 4 - rand() * 20, s: 0.9 + rand() * 0.6 });
  }
  group.add(scatter(models, TREE_KINDS, frame, foliage, { scale: 4.4, seed: 16 }));
  const edge: Spot[] = frame.map((f) => ({ x: f.x + (rand() - 0.5) * 8 * Math.sign(f.x), z: f.z + 3 + rand() * 4 }));
  group.add(scatter(models, BUSH_KINDS, edge, foliage, { scale: 2.6, seed: 17 }));
  const meadow: Spot[] = [];
  for (let i = 0; i < (lite ? 40 : 100); i++) meadow.push({ x: (rand() - 0.5) * 90, z: 6 - rand() * 28 });
  group.add(scatter(models, FLOWER_KINDS, meadow.filter((m) => Math.abs(m.z + 24) > 3.2 && Math.abs(m.x - 2) > 5), foliage, { scale: 2.2, seed: 18, shadows: false }));

  // Barisan bukit dekat di belakang: memberi lapisan kedalaman di cakrawala.
  const hills = new Parts();
  const tones = ["#8fb68b", "#9fc29a", "#7fa780", "#a9c7a2", "#86b087"];
  for (let i = 0; i < 16; i++) {
    const x = -280 + (i / 15) * 560 + (rand() - 0.5) * 20;
    const z = -195 - rand() * 35;
    const s = 30 + rand() * 22;
    hills.ball(1, tones[i % tones.length], { x, y: -s * 0.15, z, sx: s * 1.9, sy: s * (0.4 + rand() * 0.3), sz: s }, 24, 12);
  }
  group.add(hills.mesh(mat, false));

  return group;
}
