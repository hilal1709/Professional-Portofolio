"use client";

import { useEffect, useRef } from "react";

/**
 * Latar 3D header halaman proyek. three dimuat dinamis setelah halaman tampil,
 * render ±30 fps hanya saat header terlihat dan tab aktif; reduced-motion → satu frame diam.
 */
export function ProjectHero3D({ color }: { color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;

    let disposed = false;
    let raf = 0;
    let visible = true;
    let scene: ReturnType<typeof import("./story/world/mini").createMiniScene> | null = null;
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };
    const size = () => scene?.resize(canvas.clientWidth, canvas.clientHeight);
    const onVisibility = () => {
      if (visible && !raf && !reduced) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !reduced) raf = requestAnimationFrame(loop);
    });
    let last = 0;
    function loop(now: number) {
      raf = 0;
      if (!scene || !visible || document.hidden) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / 30) return;
      last = now;
      scene.render(now / 1000, pointer.x, pointer.y);
    }

    import("./story/world/mini")
      .then(({ createMiniScene }) => {
        if (disposed) return;
        scene = createMiniScene(canvas, color);
        size();
        canvas.style.opacity = "1";
        if (reduced) {
          scene.render(0, 0, 0);
          return;
        }
        io.observe(canvas);
        window.addEventListener("resize", size);
        window.addEventListener("pointermove", onPointer, { passive: true });
        document.addEventListener("visibilitychange", onVisibility);
        raf = requestAnimationFrame(loop);
      })
      .catch(() => {});

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      scene?.dispose();
    };
  }, [color]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700" />;
}
