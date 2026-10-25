import {
  BackSide,
  BufferAttribute,
  Color,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  TorusGeometry,
  type Material,
} from "three";
import { matrixOf, Parts, seeded } from "../geo";
import { POINTS } from "../stations";
import { buildTrees } from "./nature";

/** Babak Perjalanan: jalan panjang ke arah +x dengan pohon & lampu jalan. */
export function buildRoad(mat: Material, mobile: boolean) {
  const group = new Group();
  const z = -132;
  const p = new Parts();
  p.box(300, 0.06, 6, "#cdb994", { x: 110, y: 0.03, z });
  p.box(300, 0.05, 1.2, "#6f8f5a", { x: 110, y: 0.04, z: z + 3.6 });
  for (let x = -38; x < 260; x += 5) p.box(2.2, 0.08, 0.28, "#f5eee2", { x, y: 0.06, z });
  for (let x = -30; x < 260; x += 14) {
    p.cyl(0.09, 0.12, 5, "#4a4038", { x, y: 2.5, z: z + 3.2 }, 6).box(1.2, 0.12, 0.2, "#4a4038", { x: x + 0.5, y: 5, z: z + 3.2 });
    p.ico(0.32, "#ffe9a8", { x: x + 1, y: 4.75, z: z + 3.2 });
  }
  group.add(p.mesh(mat));

  const rand = seeded(31);
  const spots: { x: number; z: number; s?: number }[] = [];
  for (let x = -40; x < 260; x += mobile ? 9 : 5.5) {
    spots.push({ x: x + rand() * 3, z: z - 7 - rand() * 18, s: 1 + rand() * 0.6 });
    if (rand() > 0.55) spots.push({ x: x + rand() * 3, z: z + 6 + rand() * 3, s: 0.8 });
  }
  group.add(buildTrees(spots, 8));
  return group;
}

/** Babak Skill: bagian dalam ransel (kain bersegi) + barang-barang kecil yang melayang. */
export function buildPack(mobile: boolean) {
  const { backpack: b } = POINTS;
  const group = new Group();
  const geo = new IcosahedronGeometry(b.r, 2).toNonIndexed();
  const rand = seeded(41);
  const browns = ["#5a3d2b", "#4c3324", "#654533", "#3f2a1d"].map((c) => new Color(c));
  const colors = new Float32Array(geo.attributes.position.count * 3);
  for (let f = 0; f < colors.length / 9; f++) {
    const c = browns[Math.floor(rand() * browns.length)];
    for (let v = 0; v < 3; v++) colors.set([c.r, c.g, c.b], f * 9 + v * 3);
  }
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  const shellMat = new MeshLambertMaterial({ vertexColors: true, flatShading: true, side: BackSide, emissive: "#2a1c14", emissiveIntensity: 0.6 });
  const shell = new Mesh(geo, shellMat);
  shell.position.set(b.x, b.y, b.z);
  group.add(shell);

  // Jahitan & ritsleting: cincin tipis keemasan.
  const ringMat = new MeshBasicMaterial({ color: "#c9a77a", transparent: true, opacity: 0.55 });
  [0.82, 0.62].forEach((k, i) => {
    const ring = new Mesh(new TorusGeometry(b.r * k, 0.06, 4, 64), ringMat);
    ring.position.set(b.x, b.y, b.z - b.r * (i ? 0.75 : 0.55));
    group.add(ring);
  });

  // Barang melayang di belakang panel: berputar pelan mengelilingi arah pandang.
  const swirl = new Group();
  swirl.position.set(b.x, b.y, b.z - 4);
  const n = mobile ? 22 : 40;
  const shapes = [new OctahedronGeometry(0.45, 0), new IcosahedronGeometry(0.4, 0)];
  const tones = ["#a3191f", "#fbf3e4", "#e7c79c", "#5f8a4f", "#ffb48a"].map((c) => new Color(c));
  const m = new Matrix4();
  shapes.forEach((g, si) => {
    const mesh = new InstancedMesh(g, new MeshLambertMaterial({ flatShading: true, emissive: "#3a281d", emissiveIntensity: 0.5 }), n / 2);
    for (let i = 0; i < n / 2; i++) {
      const a = rand() * Math.PI * 2;
      const r = 7 + rand() * 6;
      mesh.setMatrixAt(i, matrixOf({ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.7, z: -rand() * 7, rx: rand() * 3, ry: rand() * 3, sx: 0.7 + rand(), sy: 0.7 + rand(), sz: 0.7 + rand() }, m));
      mesh.setColorAt(i, tones[(i + si) % tones.length]);
    }
    swirl.add(mesh);
  });
  group.add(swirl);
  return {
    group,
    animate: (t: number) => {
      swirl.rotation.z = t * 0.05;
    },
    dispose: () => {
      shellMat.dispose();
      ringMat.dispose();
    },
  };
}

/** Babak Proyek & Reel: galeri terbuka sore — deretan bingkai kayu & layar bioskop di belakang panel. */
export function buildGallery(mat: Material, mobile: boolean) {
  const group = new Group();
  const p = new Parts();
  for (let z = -230; z > -340; z -= 9) {
    const x = 42 + Math.sin(z * 0.07) * 3;
    p.box(0.6, 9, 0.6, "#8a6a4a", { x, y: 4.5, z: z - 2.6 })
      .box(0.6, 9, 0.6, "#8a6a4a", { x, y: 4.5, z: z + 2.6 })
      .box(0.9, 0.7, 6.4, "#a3191f", { x, y: 9.2, z });
  }
  // Layar bioskop terbuka (babak Reel).
  p.box(1, 15, 26, "#3a2f2a", { x: 24, y: 9, z: -262 }).box(0.6, 13, 24, "#1d1a22", { x: 24.6, y: 9, z: -262 });
  p.box(0.8, 9, 0.8, "#5b4632", { x: 24, y: 1, z: -250 }).box(0.8, 9, 0.8, "#5b4632", { x: 24, y: 1, z: -274 });
  // Bunga padang rumput.
  const rand = seeded(51);
  for (let i = 0; i < (mobile ? 60 : 140); i++) {
    p.box(0.3, 0.3, 0.3, ["#ffcf5e", "#f39a68", "#fbf3e4", "#a3191f"][i % 4], { x: 30 + rand() * 28, y: 0.2, z: -225 - rand() * 120, ry: rand() * 3 });
  }
  group.add(p.mesh(mat));
  const spots = Array.from({ length: mobile ? 14 : 26 }, () => ({ x: 6 + rand() * 30, z: -225 - rand() * 125, s: 1.1 + rand() * 0.8 }));
  group.add(buildTrees(spots, 12));
  return group;
}

/** Babak Pengalaman & Kontak: danau senja, foto melayang, lampion yang naik ke langit malam. */
export function buildDusk(mat: Material, mobile: boolean) {
  const dusk = new Group();
  const night = new Group();
  const lake = new Mesh(new PlaneGeometry(90, 70), new MeshLambertMaterial({ color: "#4a4680", emissive: "#2b2350", emissiveIntensity: 0.6 }));
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(95, 0.08, -345);
  dusk.add(lake);

  const rand = seeded(61);
  const photos = new Parts();
  for (let i = 0; i < (mobile ? 8 : 14); i++) {
    // Di sisi kanan & atas saja, supaya tidak berada di belakang daftar pengalaman (kolom kiri).
    const t = { x: 99 + rand() * 24, y: 8 + rand() * 9, z: -314 - rand() * 30, ry: (rand() - 0.5) * 0.8, rz: (rand() - 0.5) * 0.5 };
    photos.box(1.8, 2.2, 0.06, "#fbf7f0", t);
    photos.box(1.5, 1.5, 0.08, ["#5f7d4f", "#3a4a6b", "#a3191f", "#c9a77a"][i % 4], { ...t, y: t.y + 0.2 });
  }
  const photoMesh = photos.mesh(mat);
  const floating = new Group();
  floating.add(photoMesh);
  dusk.add(floating);

  // Lampion: satu InstancedMesh untuk senja (rendah) dan satu untuk malam (tinggi).
  const glow = new MeshBasicMaterial({ color: "#ffb48a", fog: false });
  const make = (count: number, yMin: number, yMax: number, zMin: number, zMax: number, size = 1) => {
    const mesh = new InstancedMesh(new IcosahedronGeometry(0.35, 0), glow, count);
    const m = new Matrix4();
    for (let i = 0; i < count; i++) {
      const s = (0.7 + rand() * 0.8) * size;
      mesh.setMatrixAt(i, matrixOf({ x: 70 + rand() * 50, y: yMin + rand() * (yMax - yMin), z: zMin - rand() * (zMax - zMin), sx: s, sy: s * 1.3, sz: s }, m));
    }
    return mesh;
  };
  const low = make(mobile ? 20 : 36, 2, 16, -310, -360);
  const high = make(mobile ? 30 : 60, 26, 70, -335, -400, 2.2);
  dusk.add(low);
  night.add(high);

  return {
    dusk,
    night,
    animate: (t: number) => {
      floating.position.y = Math.sin(t * 0.6) * 0.35;
      low.position.y = Math.sin(t * 0.5) * 0.5;
      high.position.y = Math.sin(t * 0.25) * 4;
    },
    dispose: () => glow.dispose(),
  };
}
