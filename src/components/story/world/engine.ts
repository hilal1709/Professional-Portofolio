import {
  Color,
  Material,
  Mesh,
  NeutralToneMapping,
  NoToneMapping,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { SceneKey } from "../stage/sceneStore";
import { loadModels } from "./assets";
import { buildCity, buildRoom, type Glow } from "./build/city";
import { buildLife } from "./build/life";
import { buildBase, buildClouds } from "./build/nature";
import { buildSky } from "./build/sky";
import { buildDusk, buildGallery, buildPack, buildRoad } from "./build/zones";
import { sharedTime, stylizedMaterial } from "./geo";
import { createPost, type Post } from "./post";
import type { Quality } from "./quality";
import { FOV, type Rig, type skyState } from "./rig";
import { STATIONS, type Zone } from "./stations";

/**
 * Dunia WebGL stylized. Dimuat dinamis (chunk terpisah) oleh World3D setelah halaman tampil.
 * Bangunan prosedural membulat + model alam GLB (Kenney, CC0) + rumput/air/langit ber-shader.
 */
export async function createWorld(canvas: HTMLCanvasElement, initial: Quality) {
  let q = initial;
  const renderer = new WebGLRenderer({
    canvas,
    antialias: !q.post,
    alpha: false,
    stencil: false,
    powerPreference: q.mobile ? "low-power" : "high-performance",
  });
  renderer.setPixelRatio(q.dpr);
  renderer.toneMapping = q.post ? NoToneMapping : NeutralToneMapping;
  renderer.shadowMap.enabled = q.shadow > 0;
  renderer.shadowMap.type = PCFSoftShadowMap;
  // Dunia statis: peta bayangan hanya dihitung ulang saat babak/matahari berganti.
  renderer.shadowMap.autoUpdate = false;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 1100);

  // Cahaya lingkungan lembut (IBL) dari ruangan prosedural — tanpa unduhan HDR.
  const pmrem = new PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.45;
  pmrem.dispose();

  const models = await loadModels();
  const mat = stylizedMaterial();
  const foliage = stylizedMaterial({ wind: 0.03 });

  const sky = buildSky(scene, q.mobile);
  const sun = sky.sun;
  sun.castShadow = q.shadow > 0;
  sun.shadow.mapSize.set(q.shadow || 512, q.shadow || 512);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  sun.shadow.radius = 4;
  const sc = sun.shadow.camera;
  sc.left = -60;
  sc.right = 60;
  sc.top = 60;
  sc.bottom = -60;
  sc.near = 1;
  sc.far = 220;

  const base = buildBase(mat);
  scene.add(base);
  const clouds = buildClouds(q.mobile ? 8 : 14);
  scene.add(clouds.mesh);

  const city = buildCity(mat, foliage, models, q);
  const room = buildRoom(mat, foliage, models);
  scene.add(room.lamp);
  const road = buildRoad(mat, foliage, models, q);
  const pack = buildPack(mat, q);
  const gallery = buildGallery(mat, foliage, models, q);
  const dusk = buildDusk(mat, foliage, models, q);
  const zones: Record<Zone, Object3D> = { city: city.group, room: room.group, road: road.group, pack: pack.group, gallery: gallery.group, dusk: dusk.dusk, night: dusk.night };
  Object.values(zones).forEach((z) => scene.add(z));
  // Kendaraan, burung, kunang-kunang, dll. menumpang di grup zonanya supaya ikut tampil/tersembunyi.
  const life = buildLife(mat, models, q);
  city.group.add(life.city);
  road.group.add(life.road);
  gallery.group.add(life.gallery);
  dusk.dusk.add(life.dusk);
  const glows: Glow[] = [...city.glows, ...room.glows, ...road.glows, ...gallery.glows, ...dusk.glows, ...life.glows];

  let post: Post | null = q.post ? createPost(renderer, scene, camera, q.msaa) : null;
  let size = { w: 1, h: 1 };
  const focus = new Vector3(0, 0, -30);

  const aimSun = () => {
    sun.target.position.copy(focus);
    sun.position.copy(focus).addScaledVector(sky.lightDir, 110);
    sun.target.updateMatrixWorld();
    renderer.shadowMap.needsUpdate = true;
  };
  aimSun();

  const eye = new Vector3();
  const look = new Vector3();
  const tmp = new Color();

  const refreshMaterials = () =>
    scene.traverse((o) => {
      const m = (o as Mesh).material as Material | Material[] | undefined;
      if (m) (Array.isArray(m) ? m : [m]).forEach((x) => (x.needsUpdate = true));
    });

  return {
    renderer,
    scene,
    camera,
    get quality() {
      return q;
    },
    setZones(list: Zone[], key?: SceneKey) {
      (Object.keys(zones) as Zone[]).forEach((k) => (zones[k].visible = list.includes(k)));
      // Di dalam ransel, tanah & bukit tidak boleh menembus kain.
      base.visible = !list.includes("pack");
      room.lamp.intensity = list.includes("room") ? 40 : 0;
      if (key) {
        const c = STATIONS[key].c;
        focus.set(c.x, 0, c.z - 12);
      }
      aimSun();
    },
    resize(w: number, h: number) {
      size = { w, h };
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      post?.setSize(w, h);
    },
    /** Terapkan tier kualitas baru (dipakai penurunan adaptif). */
    setQuality(next: Quality) {
      if (next.dpr !== q.dpr) renderer.setPixelRatio(next.dpr);
      if (next.post !== q.post) {
        post?.dispose();
        post = next.post ? createPost(renderer, scene, camera, next.msaa) : null;
        renderer.toneMapping = next.post ? NoToneMapping : NeutralToneMapping;
        refreshMaterials();
      }
      if (next.shadow !== q.shadow) {
        renderer.shadowMap.enabled = next.shadow > 0;
        sun.castShadow = next.shadow > 0;
        refreshMaterials();
        renderer.shadowMap.needsUpdate = true;
      }
      q = next;
      this.resize(size.w, size.h);
    },
    render(rig: Rig, s: typeof skyState, time: number, px: number, py: number) {
      sharedTime.value = time;
      eye.set(rig.px + rig.dx + px, rig.py + rig.dy + py, rig.pz + rig.dz);
      look.set(rig.tx + rig.dx, rig.ty + rig.dy * 0.6, rig.tz + rig.dz);
      camera.position.copy(eye);
      camera.lookAt(look);
      if (sky.update(s, eye)) {
        aimSun();
        // Jendela, lampu jalan & lampion makin terang saat senja/malam (nilai > 1 → bloom).
        const night = Math.min(1, s.stars * 1.4);
        glows.forEach((g) => g.mat.color.copy(g.base).multiplyScalar(0.9 + night * g.night));
        dusk.water.uniforms.uSky.value.setStyle(s.bottom).lerp(tmp.setStyle(s.top), 0.3);
      }

      clouds.mat.opacity = 0.96 * s.clouds;
      clouds.mesh.visible = s.clouds > 0.02;
      if (clouds.mesh.visible) clouds.place(time * 1.2);
      if (city.group.visible) city.animate(time);
      if (pack.group.visible) pack.animate(time);
      if (dusk.dusk.visible || dusk.night.visible) dusk.animate(time);
      life.animate(time);

      if (post) post.render();
      else renderer.render(scene, camera);
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
      models.forEach((g) => g.dispose());
      envMap.dispose();
      post?.dispose();
      sky.dispose();
      room.dispose();
      pack.dispose();
      dusk.dispose();
      life.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

export type World = Awaited<ReturnType<typeof createWorld>>;
