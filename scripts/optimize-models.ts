/**
 * Menggabung model terpilih dari Kenney Nature Kit (CC0) menjadi satu GLB terkompresi untuk dunia 3D.
 *   npx tsx scripts/optimize-models.ts "<folder GLTF format Kenney>"
 * Hasil: public/models/nature.glb — satu node akar per model, dinamai sesuai nama file.
 */
import { NodeIO, type Document } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, mergeDocuments, meshopt, prune, unpartition, weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import path from "node:path";

// Pohon dibuat prosedural (lihat softTrees di src/components/story/world/assets.ts); dari Kenney hanya props & tanaman kecil.
export const MODELS = [
  "plant_bush",
  "plant_bushLarge",
  "plant_bushDetailed",
  "rock_largeA",
  "rock_smallA",
  "stone_smallB",
  "flower_redA",
  "flower_yellowA",
  "flower_purpleA",
  "grass_large",
  "fence_simple",
  "log",
  "stump_round",
  "mushroom_red",
  "lily_large",
  "canoe",
];

async function main() {
  const src = process.argv[2];
  if (!src) throw new Error("Berikan path folder 'GLTF format' Kenney Nature Kit.");
  await MeshoptEncoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });

  let doc: Document | null = null;
  for (const name of MODELS) {
    const part = await io.read(path.join(src, `${name}.glb`));
    // Bungkus semua node akar file ini dalam satu node bernama model.
    const root = part.getRoot();
    const wrapper = part.createNode(name);
    for (const scene of root.listScenes()) {
      for (const child of scene.listChildren()) {
        scene.removeChild(child);
        wrapper.addChild(child);
      }
      scene.addChild(wrapper);
    }
    if (!doc) doc = part;
    else {
      const map = mergeDocuments(doc, part);
      const mainScene = doc.getRoot().listScenes()[0];
      for (const scene of part.getRoot().listScenes()) {
        const merged = map.get(scene) as ReturnType<Document["createScene"]>;
        for (const child of merged.listChildren()) mainScene.addChild(child);
        merged.dispose();
      }
    }
  }
  await doc!.transform(dedup(), weld(), prune(), unpartition(), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  const out = path.join(process.cwd(), "public/models/nature.glb");
  await io.write(out, doc!);
  console.log("tersimpan:", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
