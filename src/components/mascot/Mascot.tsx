"use client";

import { animate, createTimeline, type JSAnimation, type Timeline } from "animejs";
import { useEffect, useRef } from "react";
import { useSceneNear, type SceneKey } from "@/components/story/stage/sceneStore";
import { cn } from "@/lib/utils";
import { MascotSvg } from "./MascotSvg";

export type MascotPose = "idle" | "wave" | "walk" | "point" | "cheer";

type Props = {
  pose?: MascotPose;
  className?: string;
  /** Pause animasi (mis. saat bagian tidak terlihat). */
  paused?: boolean;
  /** Babak tempat maskot berada: animasi otomatis berhenti saat babak itu jauh dari layar. */
  scene?: SceneKey;
  backpack?: boolean;
};

/** Maskot hidup: anime.js menggerakkan lengan, kaki, kedipan, dan napas. */
export function Mascot({ pose = "idle", className, paused: pausedProp = false, scene, backpack = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useSceneNear(scene);
  const paused = pausedProp || !near;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const q = (sel: string) => root.querySelector<SVGGElement>(sel)!;
    const armL = q(".arm-l");
    const armR = q(".arm-r");
    const legL = q(".leg-l");
    const legR = q(".leg-r");
    const body = q(".body-bob");
    const eyes = q(".eyes");

    const anims: (JSAnimation | Timeline)[] = [];

    // Kedip acak terasa hidup.
    anims.push(
      createTimeline({ loop: true, loopDelay: 2600 })
        .add(eyes, { scaleY: [1, 0.1], duration: 90, ease: "inQuad" })
        .add(eyes, { scaleY: [0.1, 1], duration: 120, ease: "outQuad" }),
    );

    switch (pose) {
      case "wave":
        anims.push(animate(armR, { rotate: [-168, -138], duration: 360, loop: true, alternate: true, ease: "inOutSine" }));
        anims.push(animate(armL, { rotate: [6, 10], duration: 900, loop: true, alternate: true, ease: "inOutSine" }));
        anims.push(animate(body, { translateY: [0, -3], duration: 900, loop: true, alternate: true, ease: "inOutSine" }));
        break;
      case "walk":
        anims.push(animate(legL, { rotate: [-16, 16], duration: 420, loop: true, alternate: true, ease: "inOutSine" }));
        anims.push(animate(legR, { rotate: [16, -16], duration: 420, loop: true, alternate: true, ease: "inOutSine" }));
        anims.push(animate(armL, { rotate: [20, -20], duration: 420, loop: true, alternate: true, ease: "inOutSine" }));
        anims.push(animate(armR, { rotate: [-20, 20], duration: 420, loop: true, alternate: true, ease: "inOutSine" }));
        anims.push(animate(body, { translateY: [0, -4], duration: 210, loop: true, alternate: true, ease: "outQuad" }));
        break;
      case "point":
        anims.push(animate(armR, { rotate: [-88, -96], duration: 700, loop: true, alternate: true, ease: "inOutSine" }));
        anims.push(animate(body, { translateY: [0, -2], duration: 1100, loop: true, alternate: true, ease: "inOutSine" }));
        break;
      case "cheer":
        anims.push(animate(armR, { rotate: [-160, -140], duration: 300, loop: true, alternate: true, ease: "inOutSine" }));
        anims.push(animate(armL, { rotate: [160, 140], duration: 300, loop: true, alternate: true, ease: "inOutSine" }));
        anims.push(animate(body, { translateY: [0, -8], duration: 300, loop: true, alternate: true, ease: "outQuad" }));
        break;
      default:
        anims.push(animate(body, { translateY: [0, -3], duration: 1400, loop: true, alternate: true, ease: "inOutSine" }));
        anims.push(animate(armL, { rotate: [4, 8], duration: 1400, loop: true, alternate: true, ease: "inOutSine" }));
        anims.push(animate(armR, { rotate: [-4, -8], duration: 1400, loop: true, alternate: true, ease: "inOutSine" }));
    }

    // Hemat CPU/baterai: animasi hanya berjalan saat maskot terlihat.
    const setRunning = (on: boolean) => anims.forEach((a) => (on && !paused ? a.play() : a.pause()));
    setRunning(false);
    const io = new IntersectionObserver((entries) => setRunning(entries.some((e) => e.isIntersecting)), { rootMargin: "120px" });
    io.observe(root);

    return () => {
      io.disconnect();
      anims.forEach((a) => a.revert());
    };
  }, [pose, paused]);

  return (
    <div ref={ref} className={cn("pointer-events-none select-none", className)}>
      <MascotSvg backpack={backpack} className="h-full w-full overflow-visible" />
    </div>
  );
}

export function SpeechBubble({
  children,
  className,
  side = "left",
}: {
  children: React.ReactNode;
  className?: string;
  side?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "relative max-w-[16rem] rounded-2xl bg-white px-4 py-3 text-sm font-semibold leading-snug text-ink shadow-[0_10px_30px_-12px_rgba(34,28,24,0.35)]",
        className,
      )}
    >
      {children}
      <svg
        viewBox="0 0 20 14"
        aria-hidden
        className={cn("absolute -bottom-3 h-3.5 w-5 fill-white", side === "left" ? "left-6" : "right-6 -scale-x-100")}
      >
        <path d="M0 0 L20 0 L4 14 Z" />
      </svg>
    </div>
  );
}
