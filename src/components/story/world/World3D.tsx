"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { sceneStore } from "../stage/sceneStore";
import { rig, skyState, WORLD_READY, worldFlags } from "./rig";
import { ZONES, type Zone } from "./stations";

function fail() {
  worldFlags.failed = true;
  window.dispatchEvent(new CustomEvent(WORLD_READY, { detail: { ok: false } }));
}

/**
 * Kanvas dunia 3D di belakang panggung cerita. three.js dimuat dinamis (tidak masuk bundle awal),
 * render hanya saat kamera/langit berubah atau animasi ambient perlu frame baru (±30 fps),
 * berhenti saat tab tersembunyi, dan resolusi turun otomatis bila frame terasa berat.
 */
export function World3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) {
      fail();
      return;
    }

    let disposed = false;
    let world: import("./engine").World | null = null;
    let tick: ((time: number) => void) | null = null;
    let unsubscribe = () => {};
    const onResize = () => world?.resize(window.innerWidth, window.innerHeight);
    const pointer = { x: 0, y: 0, cx: 0, cy: 0 };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 1.2;
      pointer.y = -(e.clientY / window.innerHeight - 0.5) * 0.6;
    };

    import("./engine")
      .then(({ createWorld }) => {
        if (disposed) return;
        const mobile = window.innerWidth < 768;
        world = createWorld(canvas, { mobile });
        onResize();

        const syncZones = () => {
          const { scenes, active } = sceneStore.get();
          // Babak aktif + tetangganya, supaya transisi kamera tidak menampilkan dunia kosong.
          const keys = [scenes[active - 1], scenes[active], scenes[active + 1]].filter(Boolean).map((s) => s!.key);
          const list = new Set<Zone>(keys.length ? keys.flatMap((k) => ZONES[k]) : ZONES.hero);
          // Ransel hanya tampil saat kamera di dalamnya (dari luar ia cuma bola gelap di kejauhan).
          if (scenes[active]?.key !== "skills") list.delete("pack");
          world!.setZones([...list]);
        };
        syncZones();
        unsubscribe = sceneStore.subscribe(syncZones);

        let lastKey = "";
        let lastAmbient = 0;
        let slow = 0;
        let fast = 0;
        let prev = 0;
        tick = (time: number) => {
          if (!world || document.hidden) return;
          pointer.cx += (pointer.x - pointer.cx) * 0.06;
          pointer.cy += (pointer.y - pointer.cy) * 0.06;
          const key = `${rig.px},${rig.py},${rig.pz},${rig.tx},${rig.ty},${rig.tz},${rig.dx},${rig.dy},${rig.dz},${skyState.top},${skyState.stars},${pointer.cx.toFixed(3)},${pointer.cy.toFixed(3)}`;
          const moved = key !== lastKey;
          if (!moved && time - lastAmbient < 1 / 30) return;
          lastKey = key;
          lastAmbient = time;
          world.render(rig, skyState, time, pointer.cx, pointer.cy);

          // Kualitas adaptif: turunkan pixel ratio bila frame berturut-turut lambat.
          const dt = time - prev;
          prev = time;
          if (moved && dt > 0 && dt < 0.2) {
            if (dt > 1 / 40) slow++;
            else if (dt < 1 / 55) fast++;
            if (slow > 45 && world.pixelRatio > 0.75) {
              world.setPixelRatio(Math.max(0.75, world.pixelRatio - 0.25));
              onResize();
              slow = fast = 0;
            } else if (fast > 240) slow = fast = 0;
          }
        };
        tick(gsap.ticker.time);
        gsap.ticker.add(tick, false, false);
        window.addEventListener("resize", onResize);
        window.addEventListener("pointermove", onPointer, { passive: true });

        worldFlags.ready = true;
        document.documentElement.classList.add("world-on");
        if (process.env.NODE_ENV === "development") Object.assign(window, { __world: world });
        window.dispatchEvent(new CustomEvent(WORLD_READY, { detail: { ok: true } }));
      })
      .catch((err) => {
        console.warn("Dunia 3D tidak bisa dimuat, memakai lanskap 2D.", err);
        fail();
      });

    return () => {
      disposed = true;
      if (tick) gsap.ticker.remove(tick);
      unsubscribe();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.classList.remove("world-on");
      worldFlags.ready = false;
      world?.dispose();
      world = null;
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="world-canvas pointer-events-none fixed inset-0 -z-[5] h-full w-full" />;
}
