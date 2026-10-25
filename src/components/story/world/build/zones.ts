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
  MeshStandardMaterial,
  CircleGeometry,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  type Material,
} from "three";
import type { Models } from "../assets";
import { matrixOf, Parts, seeded, sharedTime } from "../geo";
import type { Quality } from "../quality";
import { POINTS } from "../stations";
import type { Glow } from "./city";
import { BUSH_KINDS, buildGrass, FLOWER_KINDS, scatter, TREE_KINDS, type Spot } from "./nature";

const ROAD_Z = -132;

/** Babak Perjalanan: jalan panjang ke arah +x dengan pagar, lampu jalan, pohon rimbun & rumput. */
export function buildRoad(mat: Material, foliage: Material, models: Models, q: Quality) {
  const group = new Group();
  const z = ROAD_Z;
  const p = new Parts();
  const bulbs = new Parts();
  p.box(300, 0.1, 6, "#dccaa4", { x: 110, y: 0.04, z }, 0.04);
  for (let x = -38; x < 260; x += 5) p.box(2.2, 0.12, 0.28, "#fbf3e4", { x, y: 0.08, z }, 0.05);
  for (let x = -30; x < 260; x += 14) {
    p.cyl(0.09, 0.13, 5, "#4a4038", { x, y: 2.5, z: z + 3.4 }, 12).box(1.3, 0.14, 0.2, "#4a4038", { x: x + 0.55, y: 5, z: z + 3.4 }, 0.06);
    bulbs.ball(0.3, "#ffe3a3", { x: x + 1.05, y: 4.75, z: z + 3.4 }, 14, 10);
  }
  group.add(p.mesh(mat));
  const bulbMat = new MeshBasicMaterial({ vertexColors: true });
  group.add(bulbs.mesh(bulbMat, false));

  const rand = seeded(31);
  const trees: Spot[] = [];
  const bushes: Spot[] = [];
  const flowers: Spot[] = [];
  for (let x = -40; x < 260; x += q.mobile ? 9 : 6.5) {
    trees.push({ x: x + rand() * 3, z: z - 8 - rand() * 18, s: 1 + rand() * 0.5 });
    if (rand() > 0.5) bushes.push({ x: x + rand() * 4, z: z - 4.5 - rand() * 2 });
    if (rand() > 0.4) flowers.push({ x: x + rand() * 4, z: z - 3.6 - rand() * 2.5 });
    if (rand() > 0.6) flowers.push({ x: x + rand() * 4, z: z + 4.4 + rand() * 1.5 });
  }
  group.add(scatter(models, TREE_KINDS, trees, foliage, { scale: 4.4, seed: 8 }));
  group.add(scatter(models, BUSH_KINDS, bushes, foliage, { scale: 2.4, seed: 9 }));
  group.add(scatter(models, FLOWER_KINDS, flowers, foliage, { scale: 2.2, seed: 10, shadows: false }));
  const fence: Spot[] = [];
  for (let x = -36; x < 256; x += 2.4) fence.push({ x, z: z - 3.4, ry: 0, s: 1 });
  group.add(scatter(models, ["fence_simple"], fence, mat, { scale: 2.4, seed: 1 }));

  if (q.grass) {
    const g = buildGrass(
      q.grass,
      (r) => {
        const x = -30 + r() * 160;
        return { x, z: z - 3.7 - r() * 6 };
      },
      12,
    );
    group.add(g.mesh);
  }
  return { group, glows: [{ mat: bulbMat, base: new Color(1, 1, 1), night: 2 }] as Glow[] };
}

/** Babak Skill: bagian dalam ransel — kain lembut bergaris jahitan + barang-barang kecil yang melayang. */
export function buildPack(mat: Material, q: Quality) {
  const { backpack: b } = POINTS;
  const group = new Group();
  const geo = new SphereGeometry(b.r, 64, 40);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const base = new Color("#6a4632");
  const dark = new Color("#4a2f20");
  const stitch = new Color("#d9b27a");
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / b.r;
    const a = Math.atan2(pos.getZ(i), pos.getX(i));
    // Panel kain bergantian + garis jahitan tipis.
    const panel = Math.sin(a * 6) > 0 ? 0.12 : 0;
    c.copy(base).lerp(dark, Math.max(0, 0.25 + panel - (1 - Math.abs(y)) * 0.2));
    if (Math.abs(Math.sin(a * 6)) < 0.04 || Math.abs(y - 0.55) < 0.012) c.copy(stitch);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  const shellMat = new MeshStandardMaterial({ vertexColors: true, side: BackSide, roughness: 1, emissive: "#3a2418", emissiveIntensity: 0.55 });
  const shell = new Mesh(geo, shellMat);
  shell.position.set(b.x, b.y, b.z);
  group.add(shell);

  const ringMat = new MeshBasicMaterial({ color: "#e7c79c" });
  [0.8, 0.6].forEach((k, i) => {
    const ring = new Mesh(new TorusGeometry(b.r * k, 0.08, 10, 96), ringMat);
    ring.position.set(b.x, b.y, b.z - b.r * (i ? 0.78 : 0.58));
    group.add(ring);
  });

  // Barang melayang (pensil, buku, bola, kubus) di belakang panel, berputar pelan mengelilingi arah pandang.
  const swirl = new Group();
  swirl.position.set(b.x, b.y, b.z - 4);
  const rand = seeded(41);
  const n = q.mobile ? 18 : 32;
  const p = new Parts();
  const tones = ["#d2453b", "#fbf3e4", "#f2c14e", "#6fa556", "#ffb48a", "#5b7bd1"];
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2;
    const r = 7 + rand() * 6;
    const t = { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.7, z: -rand() * 7, rx: rand() * 3, ry: rand() * 3, rz: rand() * 3 };
    const col = tones[i % tones.length];
    if (i % 4 === 0) p.cyl(0.14, 0.14, 2.2, col, t, 6);
    else if (i % 4 === 1) p.box(1.2, 0.3, 0.9, col, t, 0.08);
    else if (i % 4 === 2) p.ball(0.45, col, t);
    else p.box(0.7, 0.7, 0.7, col, t, 0.18);
  }
  swirl.add(p.mesh(mat, false));
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

/** Babak Proyek & Reel: galeri terbuka sore — deretan gapura kayu, layar bioskop, padang bunga. */
export function buildGallery(mat: Material, foliage: Material, models: Models, q: Quality) {
  const group = new Group();
  const p = new Parts();
  for (let z = -230; z > -340; z -= 9) {
    const x = 42 + Math.sin(z * 0.07) * 3;
    p.box(0.7, 9, 0.7, "#9a7651", { x, y: 4.5, z: z - 2.6 }, 0.2)
      .box(0.7, 9, 0.7, "#9a7651", { x, y: 4.5, z: z + 2.6 }, 0.2)
      .box(1, 0.8, 6.8, "#b2252b", { x, y: 9.2, z }, 0.25);
  }
  p.box(1.2, 15.5, 27, "#4a3a32", { x: 24, y: 9, z: -262 }, 0.4).box(0.6, 13, 24, "#1d1a22", { x: 24.7, y: 9, z: -262 }, 0.1);
  p.box(1, 9, 1, "#6b5038", { x: 24, y: 1, z: -250 }, 0.2).box(1, 9, 1, "#6b5038", { x: 24, y: 1, z: -274 }, 0.2);
  group.add(p.mesh(mat));

  const rand = seeded(51);
  // Padang di belakang gapura saja (kamera di x = 70; yang terlalu dekat tampak raksasa).
  const meadow = (n: number): Spot[] => Array.from({ length: n }, () => ({ x: 26 + rand() * 24, z: -225 - rand() * 120 }));
  group.add(scatter(models, FLOWER_KINDS, meadow(q.mobile ? 50 : 110), foliage, { scale: 2.2, seed: 52, shadows: false }));
  group.add(scatter(models, BUSH_KINDS, meadow(q.mobile ? 10 : 20), foliage, { scale: 2.6, seed: 53 }));
  const treeSpots = Array.from({ length: q.mobile ? 14 : 26 }, () => ({ x: 6 + rand() * 30, z: -225 - rand() * 125, s: 1.1 + rand() * 0.6 }));
  group.add(scatter(models, TREE_KINDS, treeSpots, foliage, { scale: 4.6, seed: 54 }));
  group.add(scatter(models, ["log", "stump_round", "mushroom_red", "rock_smallA"], meadow(14), mat, { scale: 2.4, seed: 55 }));
  if (q.grass) group.add(buildGrass(q.grass, (r) => ({ x: 26 + r() * 22, z: -228 - r() * 110 }), 14).mesh);
  return group;
}

const WATER_VERT = /* glsl */ `
varying vec3 vWorld;
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const WATER_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uSky;
uniform vec3 uGlow;
varying vec3 vWorld;
#include <fog_pars_fragment>
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  vec3 v = normalize(cameraPosition - vWorld);
  vec2 p = vWorld.xz * 0.35;
  float rip = noise(p + vec2(uTime * 0.25, uTime * 0.12)) + noise(p * 2.3 - vec2(uTime * 0.18, -uTime * 0.2)) * 0.5;
  vec3 n = normalize(vec3((rip - 0.75) * 0.25, 1.0, (noise(p * 1.7 + uTime * 0.1) - 0.5) * 0.25));
  float fres = pow(1.0 - max(dot(n, v), 0.0), 2.5);
  vec3 col = mix(uDeep, uSky, 0.25 + fres * 0.75);
  // Kilau acak (bukan pola grid) yang muncul-hilang pelan.
  float spark = smoothstep(0.9, 1.0, noise(vWorld.xz * 1.6 + uTime * 0.5) * noise(vWorld.xz * 0.9 - uTime * 0.3) * 1.5);
  float far = smoothstep(8.0, 40.0, length(cameraPosition - vWorld));
  col += uGlow * spark * 0.45 * far;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

/** Babak Pengalaman & Kontak: danau senja berkilau, foto melayang, lampion yang naik ke langit malam. */
export function buildDusk(mat: Material, foliage: Material, models: Models, q: Quality) {
  const dusk = new Group();
  const night = new Group();
  const water = new ShaderMaterial({
    vertexShader: WATER_VERT,
    fragmentShader: WATER_FRAG,
    fog: true,
    uniforms: {
      uTime: sharedTime,
      uDeep: { value: new Color("#2b2858") },
      uSky: { value: new Color("#9c5577") },
      uGlow: { value: new Color("#ffcf9a") },
      fogColor: { value: new Color() },
      fogNear: { value: 1 },
      fogFar: { value: 1000 },
      fogDensity: { value: 0.0025 },
    },
  });
  // Danau elips (lingkaran yang diregangkan), bukan persegi.
  const lake = new Mesh(new CircleGeometry(1, 72), water);
  lake.rotation.x = -Math.PI / 2;
  lake.scale.set(44, 34, 1);
  lake.position.set(95, 0.08, -345);
  dusk.add(lake);

  const rand = seeded(61);
  const shore: Spot[] = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return { x: 95 + Math.cos(a) * (44 + rand() * 6), z: -345 + Math.sin(a) * (34 + rand() * 5) };
  });
  dusk.add(scatter(models, [...BUSH_KINDS, "rock_largeA", "grass_large"], shore, foliage, { scale: 2.8, seed: 62 }));
  dusk.add(scatter(models, ["lily_large"], Array.from({ length: 12 }, () => ({ x: 80 + rand() * 30, z: -315 - rand() * 40, y: 0.1 })), foliage, { scale: 2, seed: 63, shadows: false }));
  dusk.add(scatter(models, ["canoe"], [{ x: 104, z: -326, y: 0.05, ry: 0.6 }], mat, { scale: 3, seed: 64 }));

  const photos = new Parts();
  for (let i = 0; i < (q.mobile ? 8 : 14); i++) {
    // Di sisi kanan & atas saja, supaya tidak berada di belakang daftar pengalaman (kolom kiri).
    const t = { x: 99 + rand() * 24, y: 8 + rand() * 9, z: -314 - rand() * 30, ry: (rand() - 0.5) * 0.8, rz: (rand() - 0.5) * 0.5 };
    photos.box(1.8, 2.2, 0.08, "#fbf7f0", t, 0.04);
    photos.box(1.5, 1.5, 0.1, ["#6fa556", "#5b7bd1", "#d2453b", "#e0a458"][i % 4], { ...t, y: t.y + 0.2 }, 0.03);
  }
  const floating = new Group();
  floating.add(photos.mesh(mat, false));
  dusk.add(floating);

  // Lampion: bola bercahaya (warna > 1 → kena bloom).
  const glow = new MeshBasicMaterial({ color: new Color("#ffb070").multiplyScalar(2.2), fog: false });
  const make = (count: number, yMin: number, yMax: number, zMin: number, zMax: number, size = 1) => {
    const mesh = new InstancedMesh(new IcosahedronGeometry(0.35, 2), glow, count);
    const m = new Matrix4();
    for (let i = 0; i < count; i++) {
      const s = (0.7 + rand() * 0.8) * size;
      mesh.setMatrixAt(i, matrixOf({ x: 70 + rand() * 50, y: yMin + rand() * (yMax - yMin), z: zMin + rand() * (zMax - zMin), sx: s, sy: s * 1.3, sz: s }, m));
    }
    return mesh;
  };
  const low = make(q.mobile ? 20 : 36, 2, 16, -310, -360);
  const high = make(q.mobile ? 16 : 28, 34, 90, -370, -440, 1.6);
  dusk.add(low);
  night.add(high);

  return {
    dusk,
    night,
    water,
    animate: (t: number) => {
      floating.position.y = Math.sin(t * 0.6) * 0.35;
      low.position.y = Math.sin(t * 0.5) * 0.5;
      high.position.y = Math.sin(t * 0.25) * 4;
    },
    dispose: () => {
      glow.dispose();
      water.dispose();
    },
  };
}
