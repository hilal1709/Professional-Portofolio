import {
  BufferAttribute,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  type Material,
} from "three";
import type { ModelName, Models } from "../assets";
import { matrixOf, Parts, seeded, stylizedMaterial } from "../geo";

/** Tanah luas + bukit-bukit lembut di kejauhan (selalu tampil, kecuali di dalam ransel). */
export function buildBase(mat: Material) {
  const group = new Group();
  const ground = new Mesh(new PlaneGeometry(1600, 1600, 1, 1), new MeshStandardMaterial({ color: "#86ad69", roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(50, 0, -180);
  ground.receiveShadow = true;
  group.add(ground);

  const hills = new Parts();
  const rand = seeded(11);
  const tones = ["#9fc29a", "#8fb68b", "#a9c7a2", "#7fa780"];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rand() * 0.2;
    const r = 230 + rand() * 90;
    const s = 40 + rand() * 50;
    const hx = 50 + Math.cos(a) * r;
    const hz = -180 + Math.sin(a) * r;
    // Cincin bukit melewati dekat kamera Hero (z ≈ 10): lewati yang akan menutupi layar.
    if (Math.hypot(hx, hz - 10) < s * 1.8 + 30) continue;
    hills.ball(1, tones[i % tones.length], { x: 50 + Math.cos(a) * r, y: -s * 0.12, z: -180 + Math.sin(a) * r, sx: s * 1.7, sy: s * (0.32 + rand() * 0.28), sz: s }, 24, 12);
  }
  group.add(hills.mesh(mat, false));

  // Pegunungan jauh di balik cincin bukit: dua lapis kerucut lembut kebiruan (ditelan kabut → kesan jauh).
  const peaks = new Parts();
  const blues = [
    ["#a7bfc9", "#b4c9cf"],
    ["#93adbb", "#9fb6c2"],
  ];
  [0, 1].forEach((layer) => {
    const n = layer ? 22 : 30;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.15;
      const r = (layer ? 470 : 400) + rand() * 40;
      const w = 50 + rand() * 50;
      const h = (layer ? 80 : 50) + rand() * 45;
      peaks.cone(1, 1, blues[layer][i % 2], { x: 50 + Math.cos(a) * r, y: h / 2 - 4, z: -180 + Math.sin(a) * r, sx: w, sy: h, sz: w * 0.8, ry: rand() }, 9);
    }
  });
  group.add(peaks.mesh(mat, false));
  return group;
}

export type Spot = { x: number; z: number; s?: number; ry?: number; y?: number };

/**
 * Sebar model GLB sebagai InstancedMesh — satu draw call per jenis model, berapa pun jumlahnya.
 * `kinds` bergiliran dipakai untuk tiap titik.
 */
export function scatter(models: Models, kinds: ModelName[], spots: Spot[], mat: Material, { scale = 1, seed = 3, shadows = true } = {}) {
  const rand = seeded(seed);
  const group = new Group();
  const byKind = new Map<ModelName, Spot[]>();
  spots.forEach((p, i) => {
    const k = kinds[i % kinds.length];
    if (!byKind.has(k)) byKind.set(k, []);
    byKind.get(k)!.push(p);
  });
  const m = new Matrix4();
  byKind.forEach((list, k) => {
    const geo = models.get(k);
    if (!geo) return;
    const mesh = new InstancedMesh(geo, mat, list.length);
    list.forEach((p, i) => {
      const s = scale * (p.s ?? 1) * (0.85 + rand() * 0.35);
      mesh.setMatrixAt(i, matrixOf({ x: p.x, y: p.y ?? 0, z: p.z, ry: p.ry ?? rand() * Math.PI * 2, sx: s, sy: s, sz: s }, m));
    });
    mesh.computeBoundingSphere();
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    group.add(mesh);
  });
  return group;
}

/** Pohon & semak rimbun dari GLB (bergoyang lewat material angin). */
export const TREE_KINDS: ModelName[] = ["soft_round", "soft_wide", "soft_tall", "soft_round"];
export const BUSH_KINDS: ModelName[] = ["plant_bush", "plant_bushLarge", "plant_bushDetailed"];
export const FLOWER_KINDS: ModelName[] = ["flower_redA", "flower_yellowA", "flower_purpleA"];

/**
 * Rumput: ribuan helai instanced yang bergoyang angin (vertex shader), warna gelap di akar → terang di ujung.
 * `area(rand)` mengembalikan posisi helai atau null untuk dilewati (mis. di atas jalan).
 */
export function buildGrass(count: number, area: (rand: () => number) => { x: number; z: number } | null, seed = 9) {
  const blade = new PlaneGeometry(0.22, 1, 1, 3);
  blade.translate(0, 0.5, 0);
  const pos = blade.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const root = new Color("#5e9146");
  const tip = new Color("#c2df8a");
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setX(i, pos.getX(i) * (1 - y * 0.85));
    c.copy(root).lerp(tip, y);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  blade.setAttribute("color", new BufferAttribute(colors, 3));
  blade.computeVertexNormals();
  const mat = stylizedMaterial({ side: DoubleSide, wind: 0.22 });
  const mesh = new InstancedMesh(blade, mat, count);
  const rand = seeded(seed);
  const m = new Matrix4();
  let n = 0;
  for (let tries = 0; n < count && tries < count * 3; tries++) {
    const p = area(rand);
    if (!p) continue;
    const h = 0.3 + rand() * 0.45;
    mesh.setMatrixAt(n++, matrixOf({ x: p.x, z: p.z, ry: rand() * Math.PI, rz: (rand() - 0.5) * 0.3, sx: 1 + rand(), sy: h, sz: 1 }, m));
  }
  mesh.count = n;
  mesh.computeBoundingSphere();
  mesh.receiveShadow = true;
  return { mesh, mat };
}

/** Awan empuk: gumpalan bola halus yang melayang pelan. */
export function buildClouds(count: number) {
  const rand = seeded(5);
  const blobs = 4;
  const mat = new MeshStandardMaterial({ color: "#ffffff", roughness: 1, emissive: "#ffffff", emissiveIntensity: 0.28, transparent: true, opacity: 0.96 });
  const mesh = new InstancedMesh(new SphereGeometry(1, 20, 14), mat, count * blobs);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  const base = Array.from({ length: count }, (_, i) => ({
    x: -120 + rand() * 340,
    y: 40 + rand() * 30,
    z: -40 - rand() * 330 - (i % 3) * 20,
    s: 4 + rand() * 4,
    v: 0.4 + rand() * 0.6,
  }));
  const offs = [
    [-1.3, 0, 0.8],
    [0, 0.35, 1.25],
    [1.3, 0.05, 0.9],
    [0.4, -0.15, 0.75],
  ];
  const m = new Matrix4();
  const place = (t: number) => {
    base.forEach((c, i) => {
      const x = ((c.x + t * c.v + 150) % 380) - 150;
      offs.forEach(([ox, oy, k], b) => {
        mesh.setMatrixAt(i * blobs + b, matrixOf({ x: x + ox * c.s, y: c.y + oy * c.s, z: c.z + (b === 3 ? c.s * 0.6 : 0), sx: c.s * k * 1.25, sy: c.s * k * 0.8, sz: c.s * k }, m));
      });
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  place(0);
  return { mesh, mat, place };
}
