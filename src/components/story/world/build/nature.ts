import {
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
  type Material,
} from "three";
import { matrixOf, Parts, seeded } from "../geo";

/** Tanah luas + cincin bukit di kejauhan (selalu tampil). */
export function buildBase(mat: Material) {
  const group = new Group();
  const ground = new Mesh(new PlaneGeometry(1600, 1600, 1, 1), new MeshLambertMaterial({ color: "#7d9c66" }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(50, 0, -180);
  group.add(ground);

  const hills = new Parts();
  const rand = seeded(11);
  const tones = ["#a9c3b6", "#8fae9b", "#9db8a6", "#7f9f8a"];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rand() * 0.2;
    const r = 230 + rand() * 90;
    const s = 40 + rand() * 50;
    hills.ico(1, tones[i % tones.length], { x: 50 + Math.cos(a) * r, y: -s * 0.15, z: -180 + Math.sin(a) * r, sx: s * 1.6, sy: s * (0.35 + rand() * 0.3), sz: s }, 1);
  }
  group.add(hills.mesh(mat));
  return group;
}

/** Pohon low-poly ber-instance: 2 draw call untuk berapa pun jumlah pohonnya. */
export function buildTrees(spots: { x: number; z: number; s?: number }[], seed = 3) {
  const rand = seeded(seed);
  const n = spots.length;
  const trunkGeo = new CylinderGeometry(0.18, 0.26, 2, 5);
  trunkGeo.translate(0, 1, 0);
  const crownGeo = new IcosahedronGeometry(1.4, 0);
  const trunks = new InstancedMesh(trunkGeo, new MeshLambertMaterial({ color: "#5b4632", flatShading: true }), n);
  const crowns = new InstancedMesh(crownGeo, new MeshLambertMaterial({ flatShading: true }), n);
  const greens = ["#4f7442", "#5f8a4f", "#3f6236", "#6f9a5c"].map((c) => new Color(c));
  const m = new Matrix4();
  spots.forEach((p, i) => {
    const s = (p.s ?? 1) * (0.8 + rand() * 0.5);
    trunks.setMatrixAt(i, matrixOf({ x: p.x, z: p.z, sx: s, sy: s, sz: s }, m));
    crowns.setMatrixAt(i, matrixOf({ x: p.x, y: 2.6 * s, z: p.z, ry: rand() * 3, sx: s, sy: s * (0.9 + rand() * 0.4), sz: s }, m));
    crowns.setColorAt(i, greens[i % greens.length]);
  });
  const group = new Group();
  group.add(trunks, crowns);
  return group;
}

/** Awan: gumpalan ikosahedron putih yang melayang pelan. */
export function buildClouds(count: number) {
  const rand = seeded(5);
  const blobs = 3;
  const mat = new MeshLambertMaterial({ color: "#ffffff", flatShading: true, transparent: true, opacity: 0.95, emissive: "#ffffff", emissiveIntensity: 0.35 });
  const mesh = new InstancedMesh(new IcosahedronGeometry(1, 0), mat, count * blobs);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  const base = Array.from({ length: count }, (_, i) => ({
    x: -120 + rand() * 340,
    y: 38 + rand() * 30,
    z: -40 - rand() * 330 - (i % 3) * 20,
    s: 4 + rand() * 4,
    v: 0.4 + rand() * 0.6,
  }));
  const m = new Matrix4();
  const place = (t: number) => {
    base.forEach((c, i) => {
      const x = ((c.x + t * c.v + 150) % 380) - 150;
      for (let b = 0; b < blobs; b++) {
        const k = b === 1 ? 1.25 : 0.85;
        mesh.setMatrixAt(i * blobs + b, matrixOf({ x: x + (b - 1) * c.s * 1.2, y: c.y + (b === 1 ? c.s * 0.25 : 0), z: c.z, sx: c.s * k * 1.4, sy: c.s * k * 0.75, sz: c.s * k }, m));
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  place(0);
  return { mesh, mat, place };
}
