import {
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  TorusGeometry,
  WebGLRenderer,
  type BufferGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { seeded } from "./geo";

/**
 * Adegan 3D kecil untuk header halaman proyek: bentuk low-poly berwarna proyek yang melayang.
 * Memakai chunk three yang sama dengan dunia utama; tanpa aset unduhan.
 */
export function createMiniScene(canvas: HTMLCanvasElement, color: string) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = NeutralToneMapping;
  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 14);
  scene.add(new HemisphereLight("#fff6e8", "#a8936c", 2.2));
  const sun = new DirectionalLight("#ffffff", 1.8);
  sun.position.set(4, 6, 8);
  scene.add(sun);

  const base = new Color(color);
  const tones = [base, base.clone().lerp(new Color("#ffffff"), 0.45), new Color("#f5eee2"), new Color("#221c18"), new Color("#cdb994")];
  // Bentuk halus & membulat (gaya yang sama dengan dunia 3D di beranda).
  const geos: BufferGeometry[] = [new SphereGeometry(1, 32, 20), new RoundedBoxGeometry(1.5, 1.5, 1.5, 4, 0.35), new TorusGeometry(0.8, 0.32, 24, 48)];
  const mats = tones.map((c) => new MeshStandardMaterial({ color: c, roughness: 0.6 }));
  const rand = seeded(19);
  const group = new Group();
  const items = Array.from({ length: 14 }, (_, i) => {
    const mesh = new Mesh(geos[i % geos.length], mats[i % mats.length]);
    const s = 0.4 + rand() * 0.9;
    mesh.scale.setScalar(s);
    // Kumpul di sisi kanan supaya judul di kiri tetap terbaca.
    mesh.position.set(0.5 + rand() * 6, (rand() - 0.5) * 6, (rand() - 0.5) * 4);
    mesh.rotation.set(rand() * 3, rand() * 3, 0);
    group.add(mesh);
    return { mesh, spin: 0.2 + rand() * 0.5, phase: rand() * 6, y: mesh.position.y };
  });
  scene.add(group);

  return {
    resize(w: number, h: number) {
      camera.aspect = w / h;
      // Layar sempit: geser kamera supaya bentuk tetap di kanan tapi tidak terpotong habis.
      camera.position.x = w < 640 ? 4 : 0;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    },
    render(t: number, px: number, py: number) {
      items.forEach((it) => {
        it.mesh.rotation.x += 0.004 * it.spin;
        it.mesh.rotation.y += 0.006 * it.spin;
        it.mesh.position.y = it.y + Math.sin(t * 0.8 + it.phase) * 0.25;
      });
      group.rotation.y += (px * 0.25 - group.rotation.y) * 0.05;
      group.rotation.x += (-py * 0.15 - group.rotation.x) * 0.05;
      renderer.render(scene, camera);
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
