import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  type Material,
} from "three";
import type { Models } from "../assets";
import { matrixOf, Parts, seeded, type Xf } from "../geo";
import type { Quality } from "../quality";
import type { Glow } from "./city";

/**
 * Kehidupan yang bergerak di dunia: kendaraan & pejalan kaki, burung, layang-layang,
 * kelopak beterbangan, kunang-kunang, kano, kincir angin. Semua InstancedMesh dinamis
 * (satu draw call per bagian) dan tidak memberi bayangan — peta bayangan tidak dihitung tiap frame.
 */

type Rand = () => number;
const _m = new Matrix4();
const _l = new Matrix4();
const _w = new Matrix4();
const _c = new Color();

function dynamic(geo: BufferGeometry, mat: Material, count: number) {
  const mesh = new InstancedMesh(geo, mat, count);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.receiveShadow = true;
  return mesh;
}

/** Aktor dari beberapa bagian (yang `tint` diwarnai per-instance) yang berbagi satu matriks. */
function actors(group: Group, mat: Material, parts: { geo: BufferGeometry; tint?: boolean }[], count: number, colors: string[]) {
  const meshes = parts.map(({ geo, tint }) => {
    const mesh = dynamic(geo, mat, count);
    if (tint) for (let i = 0; i < count; i++) mesh.setColorAt(i, _c.set(colors[i % colors.length]));
    group.add(mesh);
    return mesh;
  });
  return {
    set: (i: number, m: Matrix4) => meshes.forEach((x) => x.setMatrixAt(i, m)),
    flush: () => meshes.forEach((x) => (x.instanceMatrix.needsUpdate = true)),
  };
}

const wrap = (v: number, min: number, max: number) => ((((v - min) % (max - min)) + (max - min)) % (max - min)) + min;

/** Lalu-lalang sepanjang sumbu x pada beberapa lajur (arah +1 / −1), muncul lagi di ujung lain. */
function traffic(actor: ReturnType<typeof actors>, n: number, lanes: { z: number; dir: number }[], x: [number, number], v: [number, number], rand: Rand, bob = 0) {
  const list = Array.from({ length: n }, (_, i) => ({ lane: lanes[i % lanes.length], x0: x[0] + rand() * (x[1] - x[0]), v: v[0] + rand() * (v[1] - v[0]), ph: rand() * 6 }));
  return (t: number) => {
    list.forEach((a, i) => {
      const px = wrap(a.x0 + a.lane.dir * a.v * t, x[0], x[1]);
      const y = bob ? Math.abs(Math.sin(t * a.v * 2.2 + a.ph)) * bob : 0;
      actor.set(i, matrixOf({ x: px, y, z: a.lane.z, ry: a.lane.dir > 0 ? 0 : Math.PI }, _m));
    });
    actor.flush();
  };
}

const CAR_COLORS = ["#d2453b", "#f2c14e", "#5b7bd1", "#fbf3e4", "#6fa556", "#e0a458", "#3a4a6b"];
const SHIRTS = ["#d2453b", "#5b7bd1", "#f2c14e", "#6fa556", "#fbf3e4", "#9a7fd1", "#e0a458"];

function vehicleGeos() {
  const body = new Parts().box(3.4, 0.9, 1.6, "#ffffff", { y: 0.75 }, 0.3).box(1.9, 0.75, 1.42, "#ffffff", { x: -0.25, y: 1.5 }, 0.28).geometry();
  const trim = new Parts();
  [-1.1, 1.1].forEach((x) => [-0.78, 0.78].forEach((z) => trim.cyl(0.36, 0.36, 0.22, "#2a2522", { x, y: 0.36, z, rx: Math.PI / 2 }, 14)));
  trim.box(1.4, 0.45, 1.46, "#cfe3ea", { x: -0.3, y: 1.55 }, 0.12).box(0.08, 0.5, 1.2, "#cfe3ea", { x: 0.71, y: 1.52 }, 0.03);
  [-0.5, 0.5].forEach((z) => trim.ball(0.13, "#fff3c4", { x: 1.68, y: 0.85, z }, 10, 8));
  const motorBody = new Parts().box(1.5, 0.42, 0.36, "#ffffff", { y: 0.65 }, 0.15).cyl(0.2, 0.25, 0.7, "#ffffff", { x: -0.15, y: 1.25 }, 10).geometry();
  const motorTrim = new Parts();
  [-0.6, 0.6].forEach((x) => motorTrim.cyl(0.3, 0.3, 0.12, "#2a2522", { x, y: 0.3, rx: Math.PI / 2 }, 12));
  motorTrim.ball(0.22, "#3a3330", { x: -0.12, y: 1.78 }, 12, 8).box(0.5, 0.2, 0.42, "#3a4a6b", { x: 0.05, y: 0.9 }, 0.08);
  return { car: [{ geo: body, tint: true }, { geo: trim.geometry() }], motor: [{ geo: motorBody, tint: true }, { geo: motorTrim.geometry() }] };
}

function personGeos() {
  const torso = new Parts().cyl(0.22, 0.27, 0.72, "#ffffff", { y: 1.15 }, 10).geometry();
  const rest = new Parts().ball(0.2, "#c99269", { y: 1.74 }, 12, 8).box(0.34, 0.8, 0.22, "#3a4a6b", { y: 0.42 }, 0.08).dome(0.21, "#2a2522", { y: 1.78 }).geometry();
  return [{ geo: torso, tint: true }, { geo: rest }];
}

/** Kawanan burung terbang melingkar; sayap kiri/kanan instanced terpisah supaya bisa mengepak. */
function flock(group: Group, mat: Material, n: number, c: { x: number; y: number; z: number }, r: number, speed: number, rand: Rand) {
  const left = new Parts().box(0.9, 0.05, 1.1, "#3b3431", { z: 0.55 }, 0.02).ball(0.2, "#3b3431", { sx: 2.2 }, 10, 8).geometry();
  const right = new Parts().box(0.9, 0.05, 1.1, "#3b3431", { z: -0.55 }, 0.02).geometry();
  const wl = dynamic(left, mat, n);
  const wr = dynamic(right, mat, n);
  group.add(wl, wr);
  const birds = Array.from({ length: n }, (_, i) => ({ lag: i * 0.045 + rand() * 0.02, dr: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 1.6, dy: rand() * 2, ph: rand() * 6, s: 1.1 + rand() * 0.4 }));
  return (t: number) => {
    birds.forEach((b, i) => {
      const a = t * speed - b.lag;
      const rr = r + b.dr;
      const at: Xf = { x: c.x + Math.cos(a) * rr, y: c.y + b.dy + Math.sin(t * 0.7 + b.ph) * 1.2, z: c.z + Math.sin(a) * rr, ry: -a - Math.PI / 2, sx: b.s, sy: b.s, sz: b.s };
      const flap = Math.sin(t * 9 + b.ph) * 0.6;
      matrixOf(at, _m);
      wl.setMatrixAt(i, _w.copy(_m).multiply(matrixOf({ rx: -flap }, _l)));
      wr.setMatrixAt(i, _m.multiply(matrixOf({ rx: flap }, _l)));
    });
    wl.instanceMatrix.needsUpdate = true;
    wr.instanceMatrix.needsUpdate = true;
  };
}

/** Kelopak/daun kecil yang melayang turun tertiup angin di dalam kotak volume. */
function drift(group: Group, mat: Material, n: number, box: { x: [number, number]; y: [number, number]; z: [number, number] }, wind: { x: number; z: number }, colors: string[], rand: Rand) {
  const mesh = dynamic(new Parts().box(0.24, 0.03, 0.15, "#ffffff", {}, 0.01).geometry(), mat, n);
  const bits = Array.from({ length: n }, (_, i) => {
    mesh.setColorAt(i, _c.set(colors[i % colors.length]));
    return { x: box.x[0] + rand() * (box.x[1] - box.x[0]), y: box.y[0] + rand() * (box.y[1] - box.y[0]), z: box.z[0] + rand() * (box.z[1] - box.z[0]), v: 0.6 + rand() * 0.8, ph: rand() * 6 };
  });
  group.add(mesh);
  return (t: number) => {
    bits.forEach((b, i) => {
      const x = wrap(b.x + wind.x * b.v * t + Math.sin(t * 1.3 + b.ph) * 0.6, box.x[0], box.x[1]);
      const y = wrap(b.y - 0.5 * b.v * t, box.y[0], box.y[1]);
      const z = wrap(b.z + wind.z * b.v * t, box.z[0], box.z[1]);
      mesh.setMatrixAt(i, matrixOf({ x, y, z, rx: t * 2.1 + b.ph, ry: t * 0.8 + b.ph, rz: t * 1.4 }, _m));
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
}

export function buildLife(mat: Material, models: Models, q: Quality) {
  const lite = q.mobile;
  const rand = seeded(91);
  const city = new Group();
  const road = new Group();
  const gallery = new Group();
  const dusk = new Group();
  const shown = (g: Group) => Boolean(g.parent?.visible);
  const v = vehicleGeos();
  const people = personGeos();

  // Kota: jalan depan (z = −24) dua lajur + trotoar.
  const cityCars = traffic(actors(city, mat, v.car, lite ? 4 : 7, CAR_COLORS), lite ? 4 : 7, [{ z: -25.2, dir: 1 }, { z: -22.8, dir: -1 }], [-72, 72], [5, 9], rand);
  const cityMotors = traffic(actors(city, mat, v.motor, lite ? 2 : 4, SHIRTS), lite ? 2 : 4, [{ z: -22.6, dir: -1 }, { z: -25.4, dir: 1 }], [-72, 72], [7, 11], rand);
  const cityWalk = traffic(actors(city, mat, people, lite ? 5 : 10, SHIRTS), lite ? 5 : 10, [{ z: -20.6, dir: 1 }, { z: -20.9, dir: -1 }, { z: -27.4, dir: 1 }], [-60, 62], [0.8, 1.5], rand, 0.06);
  const cityBirds = flock(city, mat, lite ? 5 : 7, { x: 0, y: 26, z: -70 }, 34, 0.12, rand);
  const petals = drift(city, mat, lite ? 30 : 70, { x: [-22, 22], y: [1, 15], z: [-30, -4] }, { x: 1.2, z: 0.3 }, ["#ffd1dc", "#fbf3e4", "#ffb48a", "#f7e08a"], rand);

  // Layang-layang di atas kota, talinya ke tanah di belakang kampus.
  const kiteGeo = new Parts().box(1.3, 1.3, 0.05, "#ffffff", { rz: Math.PI / 4 }, 0.02).geometry();
  kiteGeo.scale(1, 1.35, 1);
  const tail = new Parts().box(0.06, 1.8, 0.02, "#4a4038", { y: -2.1 }, 0.01);
  [0, 1, 2].forEach((k) => tail.box(0.36, 0.16, 0.03, ["#d2453b", "#f2c14e", "#5b7bd1"][k], { y: -1.5 - k * 0.55 }, 0.02));
  const nKites = lite ? 3 : 5;
  const kites = actors(city, mat, [{ geo: kiteGeo, tint: true }, { geo: tail.geometry() }], nKites, ["#d2453b", "#f2c14e", "#5b7bd1", "#6fa556", "#ffb48a"]);
  const kiteSpots = Array.from({ length: nKites }, (_, i) => ({ x: -40 + (i / Math.max(1, nKites - 1)) * 80 + (rand() - 0.5) * 8, y: 19 + rand() * 7, z: -62 - rand() * 18, ph: rand() * 6 }));
  const strings = new Float32Array(nKites * 6);
  const lineGeo = new BufferGeometry();
  lineGeo.setAttribute("position", new BufferAttribute(strings, 3).setUsage(DynamicDrawUsage));
  const lineMat = new LineBasicMaterial({ color: "#4a4038", transparent: true, opacity: 0.55 });
  const lines = new LineSegments(lineGeo, lineMat);
  lines.frustumCulled = false;
  city.add(lines);
  const flyKites = (t: number) => {
    kiteSpots.forEach((k, i) => {
      const x = k.x + Math.sin(t * 0.4 + k.ph) * 1.4;
      const y = k.y + Math.sin(t * 0.6 + k.ph) * 0.7;
      kites.set(i, matrixOf({ x, y, z: k.z, rz: Math.sin(t * 0.8 + k.ph) * 0.25 }, _m));
      strings.set([x, y - 1, k.z, k.x * 0.6, 0, k.z + 22], i * 6);
    });
    kites.flush();
    lineGeo.attributes.position.needsUpdate = true;
  };

  // Kincir angin desa (lihat scenery.ts) berputar pelan.
  const blades = new Parts();
  [0, 1, 2, 3].forEach((k) => {
    const a = (k * Math.PI) / 2;
    blades.box(0.5, 4, 0.1, "#f5eee2", { x: -Math.sin(a) * 2, y: Math.cos(a) * 2, rz: a }, 0.04);
  });
  blades.ball(0.35, "#c2453b", {}, 12, 8);
  const mill = new Mesh(blades.geometry(), mat);
  mill.position.set(84, 12.2, -61.3);
  city.add(mill);

  // Jalan Perjalanan (z = −132).
  const roadCars = traffic(actors(road, mat, v.car, lite ? 5 : 9, CAR_COLORS), lite ? 5 : 9, [{ z: -133.3, dir: 1 }, { z: -130.7, dir: -1 }], [-60, 270], [6, 10], rand);
  const roadMotors = traffic(actors(road, mat, v.motor, lite ? 3 : 6, SHIRTS), lite ? 3 : 6, [{ z: -130.5, dir: -1 }, { z: -133.5, dir: 1 }], [-60, 270], [8, 12], rand);
  const roadWalk = traffic(actors(road, mat, people, lite ? 5 : 10, SHIRTS), lite ? 5 : 10, [{ z: -128.2, dir: 1 }, { z: -128.5, dir: -1 }], [-40, 240], [0.8, 1.4], rand, 0.06);
  const roadBirds = flock(road, mat, lite ? 5 : 8, { x: 40, y: 22, z: -165 }, 40, 0.1, rand);

  // Galeri sore: burung & kelopak di depan gapura.
  const galleryBirds = flock(gallery, mat, lite ? 4 : 6, { x: 20, y: 24, z: -265 }, 28, 0.11, rand);
  const leaves = drift(gallery, mat, lite ? 30 : 60, { x: [30, 58], y: [1, 14], z: [-292, -232] }, { x: 0.2, z: 1.1 }, ["#e0a458", "#ffb48a", "#d2453b", "#f2c14e"], rand);

  // Danau senja: kano berlayar pelan, burung pulang, kunang-kunang di tepi.
  const duskBirds = flock(dusk, mat, lite ? 4 : 7, { x: 95, y: 20, z: -360 }, 34, 0.09, rand);
  const canoeGeo = models.get("canoe");
  let canoe: Mesh | null = null;
  let canoeTurn = 0;
  if (canoeGeo) {
    canoe = new Mesh(canoeGeo, mat);
    canoe.scale.setScalar(3);
    const bb = canoeGeo.boundingBox!;
    // Sumbu panjang kano mengikuti arah gerak.
    canoeTurn = bb.max.x - bb.min.x > bb.max.z - bb.min.z ? -Math.PI / 2 : 0;
    dusk.add(canoe);
  }
  const fireMat = new MeshBasicMaterial({ color: new Color("#ffe58a"), fog: false });
  const nFlies = lite ? 30 : 60;
  const flies = dynamic(new IcosahedronGeometry(0.09, 1), fireMat, nFlies);
  const fly = Array.from({ length: nFlies }, () => {
    const a = rand() * Math.PI * 2;
    return { x: 95 + Math.cos(a) * (40 + rand() * 14), y: 0.6 + rand() * 4, z: -345 + Math.sin(a) * (30 + rand() * 12), ph: rand() * 6, k: 0.6 + rand() * 1.2 };
  });
  dusk.add(flies);

  const all = (t: number) => {
    if (shown(city)) {
      cityCars(t);
      cityMotors(t);
      cityWalk(t);
      cityBirds(t);
      petals(t);
      flyKites(t);
      mill.rotation.z = t * 0.8;
    }
    if (shown(road)) {
      roadCars(t);
      roadMotors(t);
      roadWalk(t);
      roadBirds(t);
    }
    if (shown(gallery)) {
      galleryBirds(t);
      leaves(t);
    }
    if (shown(dusk)) {
      duskBirds(t);
      if (canoe) {
        const a = t * 0.04;
        canoe.position.set(98 + Math.sin(a) * 16, 0.05 + Math.sin(t * 1.4) * 0.04, -338 + Math.cos(a) * 7);
        canoe.rotation.set(Math.sin(t * 1.1) * 0.03, Math.atan2(Math.cos(a) * 16, -Math.sin(a) * 7) + canoeTurn, Math.sin(t * 0.9) * 0.04);
      }
      fly.forEach((f, i) => {
        const s = Math.max(0, Math.sin(t * f.k * 2 + f.ph)) * 1.3;
        flies.setMatrixAt(i, matrixOf({ x: f.x + Math.sin(t * 0.3 * f.k + f.ph) * 1.6, y: f.y + Math.sin(t * 0.5 + f.ph) * 0.5, z: f.z + Math.cos(t * 0.25 * f.k + f.ph) * 1.6, sx: s, sy: s, sz: s }, _m));
      });
      flies.instanceMatrix.needsUpdate = true;
    }
  };
  all(0);

  return {
    city,
    road,
    gallery,
    dusk,
    glows: [{ mat: fireMat, base: new Color("#ffe58a"), night: 2.6 }] as Glow[],
    animate: all,
    dispose: () => {
      fireMat.dispose();
      lineMat.dispose();
    },
  };
}
