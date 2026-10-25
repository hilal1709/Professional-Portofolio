import {
  BackSide,
  BoxGeometry,
  BufferAttribute,
  Color,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
  type Material,
} from "three";
import type { Models } from "../assets";
import { matrixOf, Parts, seeded } from "../geo";
import type { Quality } from "../quality";
import { POINTS } from "../stations";
import { BUSH_KINDS, buildGrass, FLOWER_KINDS, scatter, TREE_KINDS, type Spot } from "./nature";

export type Glow = { mat: MeshBasicMaterial; base: Color; night: number };

/** Kota Gresik: pabrik semen, gedung kampus UISI (dengan pintu), masjid & rumah — bentuk membulat & halus. */
export function buildCity(mat: Material, foliage: Material, models: Models, q: Quality) {
  const group = new Group();
  const p = new Parts();
  const win = new Parts();
  const { campus, door } = POINTS;
  const front = campus.z + campus.d / 2;

  // Pabrik semen: silo, menara preheater, kiln miring, cerobong bergaris merah-putih.
  [-24, -21.4, -18.8].forEach((x, i) => {
    const h = [9, 10.5, 8.5][i];
    p.cyl(1.25, 1.25, h, "#b3ada4", { x, y: h / 2, z: -50 }).dome(1.25, "#c4beb5", { x, y: h, z: -50 });
  });
  p.box(3.2, 14, 3.2, "#a29d95", { x: -14, y: 7, z: -52 });
  [3, 6, 9, 12].forEach((y) => p.box(4, 0.35, 4, "#8e8981", { x: -14, y, z: -52 }, 0.12));
  p.box(1.4, 2, 1.4, "#a29d95", { x: -14, y: 15, z: -52 });
  p.cyl(0.9, 0.9, 11, "#aaa49b", { x: -8.5, y: 2.2, z: -50, rz: Math.PI / 2 - 0.12 });
  p.cyl(0.55, 0.75, 16, "#9b968f", { x: -5, y: 8, z: -56 });
  p.cyl(0.58, 0.58, 0.8, "#a3191f", { x: -5, y: 15.6, z: -56 });
  p.cyl(0.6, 0.6, 0.5, "#f5eee2", { x: -5, y: 13.8, z: -56 });

  // Gedung kampus UISI.
  p.box(campus.w, campus.h, campus.d, "#e2cfae", { x: campus.x, y: campus.h / 2, z: campus.z }, 0.6);
  p.box(campus.w + 0.6, 0.9, campus.d + 0.6, "#b2252b", { x: campus.x, y: campus.h + 0.35, z: campus.z }, 0.35);
  p.box(9, 3, 10, "#d4bf9c", { x: campus.x, y: campus.h + 2.2, z: campus.z - 2 }, 0.5);
  p.box(9.6, 0.5, 10.6, "#b2252b", { x: campus.x, y: campus.h + 3.8, z: campus.z - 2 }, 0.2);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 10; c++) {
      const x = campus.x - 10.2 + c * 2.27;
      if (r === 0 && Math.abs(x - door.x) < 2.4) continue;
      p.box(1.5, 1.6, 0.2, "#c9b493", { x, y: 1.8 + r * 2.5, z: front + 0.02 }, 0.08);
      win.box(1.2, 1.3, 0.12, "#fff1cf", { x, y: 1.8 + r * 2.5, z: front + 0.1 }, 0.05);
    }
  }
  p.box(3.4, 4.4, 0.3, "#f5eee2", { x: door.x, y: 2.2, z: front + 0.05 }, 0.15);
  p.box(2.6, 3.8, 0.3, "#7a1116", { x: door.x, y: door.y, z: front + 0.12 }, 0.1);
  p.ball(0.12, "#f2c14e", { x: door.x + 0.9, y: door.y, z: front + 0.3 }, 10, 8);
  p.box(5.4, 0.3, 1.8, "#e8dcc6", { x: door.x, y: 0.15, z: front + 0.9 }, 0.1);
  p.box(4.8, 0.3, 1.2, "#e8dcc6", { x: door.x, y: 0.42, z: front + 0.6 }, 0.1);

  // Masjid & rumah — Gresik kota santri.
  p.box(8, 5.5, 8, "#e0cfb2", { x: 22, y: 2.75, z: -46 }, 0.4).dome(3.4, "#5f8f55", { x: 22, y: 5.5, z: -46 });
  p.ball(0.25, "#f2c14e", { x: 22, y: 9.1, z: -46 }, 10, 8);
  p.cyl(0.55, 0.6, 12, "#e0cfb2", { x: 27.5, y: 6, z: -43 }).cone(0.75, 2.2, "#5f8f55", { x: 27.5, y: 13.1, z: -43 });
  [3.4, 4.1].forEach((y) => win.box(1, 1.4, 0.1, "#fff1cf", { x: 22, y, z: -41.9 }, 0.05));
  [
    [32, -40, "#c2453b"],
    [37, -46, "#a3191f"],
    [31, -52, "#c2453b"],
  ].forEach(([x, z, roof]) => {
    const X = x as number;
    const Z = z as number;
    p.box(4.2, 3.4, 4.2, "#ecdcc0", { x: X, y: 1.7, z: Z }, 0.25).cone(3.4, 2.4, roof as string, { x: X, y: 4.6, z: Z, ry: Math.PI / 4 }, 4);
    win.box(0.9, 0.9, 0.1, "#fff1cf", { x: X, y: 1.9, z: Z + 2.15 }, 0.05);
  });
  // Jalan depan kota.
  p.box(140, 0.08, 5, "#d8c7a2", { x: 0, y: 0.03, z: -24 }, 0.02);
  for (let x = -66; x < 70; x += 6) p.box(2.6, 0.1, 0.3, "#fbf3e4", { x, y: 0.06, z: -24 }, 0.04);
  group.add(p.mesh(mat));

  // Jendela: material dasar yang makin terang saat senja/malam (kena bloom).
  const winMat = new MeshBasicMaterial({ vertexColors: true, toneMapped: true });
  group.add(win.mesh(winMat, false));
  const glows: Glow[] = [{ mat: winMat, base: new Color(1, 1, 1), night: 2.4 }];

  // Pohon, semak, bunga dari GLB; jangan di dalam gedung atau di jalur kamera ke pintu.
  const rand = seeded(21);
  const free = (x: number, z: number) => !(Math.abs(x - campus.x) < 14 && z < -14 && z > -60) && !(Math.abs(x - 2) < 6 && z > -32) && Math.abs(z + 24) > 3.2 && !(x > -27 && x < -2 && z < -44 && z > -60) && !(x > 16 && x < 41 && z < -36 && z > -56);
  const pick = (n: number, xr: [number, number], zr: [number, number]) => {
    const out: Spot[] = [];
    for (let t = 0; out.length < n && t < n * 20; t++) {
      const x = xr[0] + rand() * (xr[1] - xr[0]);
      const z = zr[0] + rand() * (zr[1] - zr[0]);
      if (free(x, z)) out.push({ x, z });
    }
    return out;
  };
  // Pohon & semak tidak terlalu dekat kamera (z > -22 akan tampak raksasa menutupi layar).
  group.add(scatter(models, TREE_KINDS, pick(q.mobile ? 18 : 30, [-45, 50], [-22, -70]), foliage, { scale: 4.2, seed: 4 }));
  group.add(scatter(models, BUSH_KINDS, pick(q.mobile ? 16 : 30, [-40, 45], [-20, -60]), foliage, { scale: 2.4, seed: 6 }));
  group.add(scatter(models, FLOWER_KINDS, pick(q.mobile ? 30 : 70, [-30, 40], [-12, -40]), foliage, { scale: 2.2, seed: 7, shadows: false }));
  group.add(scatter(models, ["rock_largeA", "rock_smallA", "stone_smallB"], pick(10, [-40, 45], [-14, -60]), mat, { scale: 2.5, seed: 8 }));

  if (q.grass) {
    const g = buildGrass(q.grass, (r) => {
      const x = -40 + r() * 85;
      const z = -10 - r() * 45;
      return free(x, z) ? { x, z } : null;
    });
    group.add(g.mesh);
  }

  // Asap cerobong: gumpalan halus yang naik berulang.
  const puffs = 8;
  const smokeMat = new MeshStandardMaterial({ color: "#ffffff", roughness: 1, transparent: true, opacity: 0.8, emissive: "#ffffff", emissiveIntensity: 0.3 });
  const smoke = new InstancedMesh(new SphereGeometry(1, 16, 12), smokeMat, puffs);
  smoke.instanceMatrix.setUsage(DynamicDrawUsage);
  smoke.frustumCulled = false;
  group.add(smoke);
  const m = new Matrix4();
  const animate = (t: number) => {
    for (let i = 0; i < puffs; i++) {
      const k = (t * 0.12 + i / puffs) % 1;
      const s = 0.9 + k * 2.4;
      smoke.setMatrixAt(i, matrixOf({ x: -5 + k * 5 + Math.sin(i) * 0.4, y: 16.5 + k * 9, z: -56 - k * 2, sx: s, sy: s * 0.85, sz: s }, m));
    }
    smoke.instanceMatrix.needsUpdate = true;
  };
  animate(0);
  return { group, animate, glows };
}

/** Ruang di dalam gedung kampus (babak Tentang): dinding bergradasi lembut, rak, jendela, lampu hangat. */
export function buildRoom(mat: Material, foliage: Material, models: Models) {
  const { campus } = POINTS;
  const box = new BoxGeometry(campus.w - 0.6, campus.h - 0.2, campus.d - 0.6, 8, 6, 8).toNonIndexed();
  box.translate(campus.x, campus.h / 2, campus.z);
  const pos = box.attributes.position;
  const normal = box.attributes.normal;
  const colors = new Float32Array(normal.count * 3);
  const tone = { floor: new Color("#c8a77a"), ceil: new Color("#fbf5ea"), wall: new Color("#f1e4cc"), low: new Color("#dcc8a6") };
  const c = new Color();
  for (let i = 0; i < normal.count; i++) {
    const ny = normal.getY(i);
    if (ny > 0.5) c.copy(tone.ceil);
    else if (ny < -0.5) c.copy(tone.floor);
    // Dinding: gradien lembut dari bawah (lebih gelap) ke atas.
    else c.copy(tone.low).lerp(tone.wall, Math.min(1, pos.getY(i) / campus.h));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  box.setAttribute("color", new BufferAttribute(colors, 3));
  const innerMat = new MeshStandardMaterial({ vertexColors: true, side: BackSide, roughness: 0.95 });
  const group = new Group();
  const shell = new Mesh(box, innerMat);
  shell.receiveShadow = true;
  group.add(shell);

  const back = campus.z - campus.d / 2 + 0.4;
  const p = new Parts();
  [-8.5, 8.5].forEach((dx) => {
    p.box(4, 6, 1, "#8a6a4a", { x: campus.x + dx, y: 3, z: back + 0.5 }, 0.12);
    [1.2, 2.7, 4.2].forEach((y, r) =>
      [-1.3, -0.5, 0.3, 1.1].forEach((bx, b) => p.box(0.5, 1, 0.6, ["#b2252b", "#5f8f55", "#e7c79c", "#3a4a6b"][(b + r) % 4], { x: campus.x + dx + bx, y: y + 0.5, z: back + 0.7 }, 0.06)),
    );
  });
  p.box(6.4, 0.25, 0.4, "#8a6a4a", { x: campus.x, y: 4.85, z: back + 0.2 }, 0.08);
  group.add(p.mesh(mat));
  const winMat = new MeshBasicMaterial({ color: "#fff6dd" });
  const win = new Mesh(new BoxGeometry(6, 3, 0.1), winMat);
  win.position.set(campus.x, 6.4, back + 0.05);
  group.add(win);
  group.add(scatter(models, ["plant_bushDetailed"], [{ x: campus.x - 5.2, z: back + 1.2 }, { x: campus.x + 5.2, z: back + 1.2 }], foliage, { scale: 1.8, seed: 2 }));

  // Lampu hangat: selalu ada di scene (intensitas 0 di luar ruang) supaya jumlah lampu tetap → shader tidak dikompilasi ulang.
  const lamp = new PointLight("#ffd9a0", 0, 30, 1.6);
  lamp.position.set(campus.x, 7.5, campus.z - 4);
  return { group, lamp, glows: [{ mat: winMat, base: new Color("#fff6dd"), night: 0.6 }] as Glow[], dispose: () => innerMat.dispose() };
}
