import { Material, Mesh, PerspectiveCamera, Scene, Vector3, WebGLRenderer, type Object3D } from "three";
import { FOV, type Rig, type skyState } from "./rig";
import type { Zone } from "./stations";
import { buildCity, buildRoom } from "./build/city";
import { buildBase, buildClouds } from "./build/nature";
import { buildSky } from "./build/sky";
import { buildDusk, buildGallery, buildPack, buildRoad } from "./build/zones";
import { lowPolyMaterial } from "./geo";

/**
 * Dunia WebGL. Dimuat dinamis (chunk terpisah) oleh World3D setelah halaman tampil.
 * Semua geometri prosedural — tidak ada file model/tekstur yang diunduh.
 */
export function createWorld(canvas: HTMLCanvasElement, { mobile }: { mobile: boolean }) {
  const dpr = window.devicePixelRatio || 1;
  const renderer = new WebGLRenderer({
    canvas,
    antialias: dpr <= 1 && !mobile,
    alpha: false,
    stencil: false,
    powerPreference: mobile ? "low-power" : "high-performance",
  });
  let pixelRatio = Math.min(dpr, mobile ? 1 : 1.5);
  renderer.setPixelRatio(pixelRatio);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 1100);
  const mat = lowPolyMaterial();

  const sky = buildSky(scene, mobile);
  const base = buildBase(mat);
  scene.add(base);
  const clouds = buildClouds(mobile ? 8 : 14);
  scene.add(clouds.mesh);

  const city = buildCity(mat, mobile);
  const room = buildRoom(mat);
  const road = buildRoad(mat, mobile);
  const pack = buildPack(mobile);
  const gallery = buildGallery(mat, mobile);
  const dusk = buildDusk(mat, mobile);
  const zones: Record<Zone, Object3D> = { city: city.group, room: room.group, road, pack: pack.group, gallery, dusk: dusk.dusk, night: dusk.night };
  Object.values(zones).forEach((z) => scene.add(z));

  const eye = new Vector3();
  const look = new Vector3();

  return {
    renderer,
    scene,
    camera,
    setZones(list: Zone[]) {
      (Object.keys(zones) as Zone[]).forEach((k) => (zones[k].visible = list.includes(k)));
      // Di dalam ransel, tanah & bukit tidak boleh menembus kain.
      base.visible = !list.includes("pack");
    },
    resize(w: number, h: number) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    },
    get pixelRatio() {
      return pixelRatio;
    },
    setPixelRatio(v: number) {
      pixelRatio = v;
      renderer.setPixelRatio(v);
    },
    render(rig: Rig, s: typeof skyState, time: number, px: number, py: number) {
      eye.set(rig.px + rig.dx + px, rig.py + rig.dy + py, rig.pz + rig.dz);
      look.set(rig.tx + rig.dx, rig.ty + rig.dy * 0.6, rig.tz + rig.dz);
      camera.position.copy(eye);
      camera.lookAt(look);
      sky.update(s, eye);

      clouds.mat.opacity = 0.95 * s.clouds;
      clouds.mesh.visible = s.clouds > 0.02;
      if (clouds.mesh.visible) clouds.place(time * 1.2);
      if (city.group.visible) city.animate(time);
      if (pack.group.visible) pack.animate(time);
      if (dusk.dusk.visible || dusk.night.visible) dusk.animate(time);

      renderer.render(scene, camera);
    },
    dispose() {
      const mats = new Set<Material>();
      scene.traverse((o) => {
        const mesh = o as Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const m = mesh.material as Material | Material[] | undefined;
        if (m) (Array.isArray(m) ? m : [m]).forEach((x) => mats.add(x));
      });
      mats.forEach((m) => m.dispose());
      sky.dispose();
      room.dispose();
      pack.dispose();
      dusk.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

export type World = ReturnType<typeof createWorld>;
