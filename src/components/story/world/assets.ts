import { BufferAttribute, BufferGeometry, Color, Mesh, type MeshStandardMaterial } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Parts, paint } from "./geo";

/**
 * Model alam dari Kenney Nature Kit (CC0), digabung & dikompres meshopt di
 * public/models/nature.glb (lihat scripts/optimize-models.ts).
 * Tiap model diubah jadi satu geometri berwarna per-vertex dengan normal halus,
 * berdiri di y = 0 — siap dipakai InstancedMesh dengan material stylized bersama.
 */

export type ModelName =
  | "plant_bush"
  | "plant_bushLarge"
  | "plant_bushDetailed"
  | "rock_largeA"
  | "rock_smallA"
  | "stone_smallB"
  | "flower_redA"
  | "flower_yellowA"
  | "flower_purpleA"
  | "grass_large"
  | "fence_simple"
  | "log"
  | "stump_round"
  | "mushroom_red"
  | "lily_large"
  | "canoe"
  // Pohon prosedural bermahkota bulat lembut (lihat softTrees).
  | "soft_round"
  | "soft_tall"
  | "soft_wide";

export type Models = Map<ModelName, BufferGeometry>;

/** Warna material Kenney diganti palet situs supaya menyatu dengan bangunan & langit. */
const PALETTE: Record<string, string> = {
  leafsGreen: "#5f9a4c",
  leafsDark: "#3f6e3a",
  leafsFall: "#e0a458",
  woodBark: "#7a5a3c",
  woodBarkDark: "#5b4632",
  woodInner: "#d9b98a",
  wood: "#a47c55",
  woodDark: "#7a5a3c",
  grass: "#6fa556",
  stone: "#b9b2a6",
  colorRed: "#d2453b",
  colorYellow: "#f2c14e",
  colorPurple: "#9a7fd1",
};

const url = "/models/nature.glb";

export async function loadModels(): Promise<Models> {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  const out: Models = new Map();
  for (const node of gltf.scene.children) {
    node.updateMatrixWorld(true);
    const parts: BufferGeometry[] = [];
    node.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as MeshStandardMaterial;
      const color = PALETTE[mat.name] ?? `#${mat.color.getHexString()}`;
      // Atribut terkuantisasi (meshopt) → Float32 dulu, baru ditransformasi (nilai ternormalisasi akan terpotong).
      const src = mesh.geometry.getAttribute("position");
      const arr = new Float32Array(src.count * 3);
      for (let i = 0; i < src.count; i++) arr.set([src.getX(i), src.getY(i), src.getZ(i)], i * 3);
      const flat = new BufferGeometry();
      flat.setAttribute("position", new BufferAttribute(arr, 3));
      if (mesh.geometry.index) flat.setIndex(mesh.geometry.index.clone());
      flat.applyMatrix4(mesh.matrixWorld);
      paint(flat, new Color(color));
      parts.push(flat);
    });
    if (!parts.length) continue;
    // Normal dihitung ulang dari vertex yang digabung → shading halus, bukan segi-segi.
    let geo = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)), false)!;
    geo = mergeVertices(geo, 1e-3);
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    geo.computeBoundingSphere();
    out.set(node.name as ModelName, geo);
  }
  softTrees().forEach((g, k) => out.set(k, g));
  gltf.scene.traverse((o) => {
    const mesh = o as Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      (mesh.material as MeshStandardMaterial).dispose();
    }
  });
  return out;
}

/**
 * Pohon stylized: batang meruncing + mahkota dari beberapa bola halus yang saling tumpuk
 * (terang di atas, lebih gelap di bawah) — siluet empuk ala ilustrasi, bukan kotak-kotak.
 * Ukuran ±1 satuan tinggi seperti model Kenney, supaya skala sebar sama.
 */
function softTrees() {
  const out = new Map<ModelName, BufferGeometry>();
  const crown = (p: Parts, blobs: [number, number, number, number][], light: string, dark: string) => {
    blobs.forEach(([x, y, z, r], i) => p.ball(r, i % 2 ? dark : light, { x, y, z }, 14, 9));
  };
  const make = (name: ModelName, trunkH: number, blobs: [number, number, number, number][], light: string, dark: string) => {
    const p = new Parts();
    p.cyl(0.035, 0.07, trunkH, "#7a5a3c", { y: trunkH / 2 }, 10);
    crown(p, blobs, light, dark);
    out.set(name, p.geometry());
  };
  make("soft_round", 0.45, [[0, 0.62, 0, 0.3], [-0.17, 0.5, 0.06, 0.21], [0.18, 0.52, -0.05, 0.22], [0.02, 0.8, 0.02, 0.2], [0.05, 0.5, 0.18, 0.18]], "#6fae55", "#5a9547");
  make("soft_tall", 0.5, [[0, 0.6, 0, 0.2], [0, 0.82, 0, 0.18], [0, 1.0, 0, 0.14], [0.08, 0.7, 0.06, 0.15], [-0.08, 0.68, -0.05, 0.15]], "#5f9d4f", "#4b8441");
  make("soft_wide", 0.38, [[0, 0.5, 0, 0.26], [-0.28, 0.44, 0, 0.2], [0.28, 0.45, 0.02, 0.21], [0.1, 0.66, 0.05, 0.19], [-0.12, 0.64, -0.06, 0.18]], "#80b85c", "#68a14d");
  return out;
}
