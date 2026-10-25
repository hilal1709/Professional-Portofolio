import { BackSide, BoxGeometry, BufferAttribute, Color, DynamicDrawUsage, Group, IcosahedronGeometry, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, type Material } from "three";
import { matrixOf, Parts, seeded } from "../geo";
import { POINTS } from "../stations";
import { buildTrees } from "./nature";

/** Kota Gresik: pabrik semen, gedung kampus UISI (dengan pintu), masjid & rumah. */
export function buildCity(mat: Material, mobile: boolean) {
  const group = new Group();
  const p = new Parts();
  const { campus, door } = POINTS;
  const front = campus.z + campus.d / 2;

  // Pabrik semen: silo, menara preheater, kiln miring, cerobong bergaris merah-putih.
  [-24, -21.4, -18.8].forEach((x, i) => {
    const h = [9, 10.5, 8.5][i];
    p.cyl(1.25, 1.25, h, "#9b968f", { x, y: h / 2, z: -50 }, 12).cyl(1.3, 1.3, 0.4, "#aaa59e", { x, y: h + 0.2, z: -50 }, 12);
  });
  p.box(3.2, 14, 3.2, "#86817a", { x: -14, y: 7, z: -52 });
  [3, 6, 9, 12].forEach((y) => p.box(4, 0.35, 4, "#77726b", { x: -14, y, z: -52 }));
  p.box(1.4, 2, 1.4, "#86817a", { x: -14, y: 15, z: -52 });
  p.cyl(0.9, 0.9, 11, "#8f8a83", { x: -8.5, y: 2.2, z: -50, rz: Math.PI / 2 - 0.12 }, 10);
  p.cyl(0.55, 0.75, 16, "#7d786f", { x: -5, y: 8, z: -56 }, 10);
  p.cyl(0.58, 0.58, 0.8, "#a3191f", { x: -5, y: 15.6, z: -56 }, 10);
  p.cyl(0.6, 0.6, 0.5, "#f5eee2", { x: -5, y: 13.8, z: -56 }, 10);

  // Gedung kampus UISI.
  p.box(campus.w, campus.h, campus.d, "#c5b49a", { x: campus.x, y: campus.h / 2, z: campus.z });
  p.box(campus.w + 0.4, 0.8, campus.d + 0.4, "#a3191f", { x: campus.x, y: campus.h + 0.4, z: campus.z });
  p.box(9, 3, 10, "#b5a387", { x: campus.x, y: campus.h + 2.3, z: campus.z - 2 });
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 10; c++) {
      const x = campus.x - 10.2 + c * 2.27;
      if (r === 0 && Math.abs(x - door.x) < 2.4) continue;
      p.box(1.2, 1.3, 0.12, "#f7e9c8", { x, y: 1.8 + r * 2.5, z: front + 0.05 });
    }
  }
  p.box(3.4, 4.4, 0.16, "#f5eee2", { x: door.x, y: 2.2, z: front + 0.04 });
  p.box(2.6, 3.8, 0.22, "#7a1116", { x: door.x, y: door.y, z: front + 0.06 });
  p.box(5, 0.3, 1.6, "#d8ccb6", { x: door.x, y: 0.15, z: front + 0.8 });

  // Masjid & rumah — Gresik kota santri.
  p.box(8, 5.5, 8, "#b9a58a", { x: 22, y: 2.75, z: -46 }).dome(3.4, "#5f7d4f", { x: 22, y: 5.5, z: -46 });
  p.cyl(0.55, 0.6, 12, "#b9a58a", { x: 27.5, y: 6, z: -43 }, 8).cone(0.7, 2, "#5f7d4f", { x: 27.5, y: 13, z: -43 }, 8);
  [
    [32, -40, "#a3191f"],
    [37, -46, "#7a1116"],
    [31, -52, "#a3191f"],
  ].forEach(([x, z, roof]) => {
    p.box(4.2, 3.4, 4.2, "#b9a58a", { x: x as number, y: 1.7, z: z as number }).cone(3.6, 2.2, roof as string, { x: x as number, y: 4.5, z: z as number, ry: Math.PI / 4 }, 4);
  });
  // Jalan depan kota.
  p.box(140, 0.06, 5, "#cdb994", { x: 0, y: 0.03, z: -24 });
  for (let x = -66; x < 70; x += 6) p.box(2.6, 0.08, 0.3, "#f5eee2", { x, y: 0.05, z: -24 });
  group.add(p.mesh(mat));

  const rand = seeded(21);
  const spots = Array.from({ length: mobile ? 16 : 30 }, (_, i) => {
    const x = -40 + rand() * 90;
    const z = -18 - rand() * 50;
    // Jangan menanam pohon di dalam gedung atau di depan pintu.
    if (Math.abs(x - campus.x) < 14 && z < -14 && z > -60) return { x: x < campus.x ? campus.x - 15 - i * 0.3 : campus.x + 15 + i * 0.3, z };
    return { x, z, s: 0.9 + (i % 3) * 0.2 };
  });
  group.add(buildTrees(spots, 4));

  // Asap cerobong: beberapa gumpalan yang naik berulang.
  const puffs = 7;
  const smokeMat = new MeshLambertMaterial({ color: "#ffffff", transparent: true, opacity: 0.75, flatShading: true, emissive: "#ffffff", emissiveIntensity: 0.3 });
  const smoke = new InstancedMesh(new IcosahedronGeometry(1, 0), smokeMat, puffs);
  smoke.instanceMatrix.setUsage(DynamicDrawUsage);
  smoke.frustumCulled = false;
  group.add(smoke);
  const m = new Matrix4();
  const animate = (t: number) => {
    for (let i = 0; i < puffs; i++) {
      const k = (t * 0.12 + i / puffs) % 1;
      const s = 0.9 + k * 2.4;
      smoke.setMatrixAt(i, matrixOf({ x: -5 + k * 5 + Math.sin(i) * 0.4, y: 16.5 + k * 9, z: -56 - k * 2, sx: s, sy: s * 0.8, sz: s }, m));
    }
    smoke.instanceMatrix.needsUpdate = true;
  };
  animate(0);
  return { group, animate };
}

/** Ruang di dalam gedung kampus (babak Tentang): dinding dalam (BackSide, tanpa pencahayaan) + rak & jendela di dinding belakang. */
export function buildRoom(mat: Material) {
  const { campus } = POINTS;
  // Warna per dinding menurut arah normalnya, supaya ruang terasa bervolume tanpa lampu tambahan.
  const box = new BoxGeometry(campus.w - 0.6, campus.h - 0.2, campus.d - 0.6).toNonIndexed();
  box.translate(campus.x, campus.h / 2, campus.z);
  const normal = box.attributes.normal;
  const colors = new Float32Array(normal.count * 3);
  const tone = { floor: new Color("#c8ae86"), ceil: new Color("#f6efe2"), back: new Color("#efe4d0"), side: new Color("#e2d3b9") };
  for (let i = 0; i < normal.count; i++) {
    const ny = normal.getY(i);
    const nz = normal.getZ(i);
    const c = ny > 0.5 ? tone.ceil : ny < -0.5 ? tone.floor : Math.abs(nz) > 0.5 ? tone.back : tone.side;
    colors.set([c.r, c.g, c.b], i * 3);
  }
  box.setAttribute("color", new BufferAttribute(colors, 3));
  const innerMat = new MeshBasicMaterial({ vertexColors: true, side: BackSide });
  const group = new Group();
  group.add(new Mesh(box, innerMat));

  const back = campus.z - campus.d / 2 + 0.4;
  const p = new Parts();
  // Rak buku kiri-kanan menempel di dinding belakang.
  [-8.5, 8.5].forEach((dx) => {
    p.box(4, 6, 1, "#8a6a4a", { x: campus.x + dx, y: 3, z: back + 0.5 });
    [1.2, 2.7, 4.2].forEach((y, r) =>
      [-1.3, -0.5, 0.3, 1.1].forEach((bx, b) => p.box(0.5, 1, 0.6, ["#a3191f", "#5f7d4f", "#e7c79c", "#3a4a6b"][(b + r) % 4], { x: campus.x + dx + bx, y: y + 0.5, z: back + 0.7 })),
    );
  });
  // Jendela terang & tanaman pot.
  p.box(6, 3, 0.1, "#fdf6e3", { x: campus.x, y: 6.4, z: back + 0.05 });
  p.box(6.4, 0.25, 0.3, "#8a6a4a", { x: campus.x, y: 4.85, z: back + 0.15 });
  [-5.2, 5.2].forEach((dx) => p.cyl(0.5, 0.4, 0.9, "#a3191f", { x: campus.x + dx, y: 0.45, z: back + 1 }, 8).ico(0.9, "#5f8a4f", { x: campus.x + dx, y: 1.6, z: back + 1 }));
  group.add(p.mesh(mat));
  return { group, dispose: () => innerMat.dispose() };
}
