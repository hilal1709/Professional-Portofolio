"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Cloud } from "./Landscape";
import { skyState } from "./world/rig";
import { sceneStore } from "./stage/sceneStore";

gsap.registerPlugin(useGSAP);

/** Palet langit per waktu. Tiap babak memilih waktunya (lihat StoryStage). */
export const SKY = {
  morning: { top: "#9fd0ef", bottom: "#f9e7c8", sunX: 18, sunY: 34, sun: "#ffd36b", sunO: 1, stars: 0, moon: 0, clouds: 1 },
  noon: { top: "#6fb6e8", bottom: "#e2f2fb", sunX: 50, sunY: 10, sun: "#fff1b8", sunO: 1, stars: 0, moon: 0, clouds: 1 },
  afternoon: { top: "#88bfe3", bottom: "#fbe0ae", sunX: 74, sunY: 26, sun: "#ffcf5e", sunO: 1, stars: 0, moon: 0, clouds: 0.9 },
  sunset: { top: "#4f4588", bottom: "#f39a68", sunX: 86, sunY: 64, sun: "#ff8a4c", sunO: 1, stars: 0.15, moon: 0, clouds: 0.25 },
  dusk: { top: "#231f48", bottom: "#9c5577", sunX: 94, sunY: 96, sun: "#ff7a45", sunO: 0.6, stars: 0.55, moon: 0.4, clouds: 0.1 },
  night: { top: "#0b1130", bottom: "#262d5a", sunX: 100, sunY: 120, sun: "#ff7a45", sunO: 0, stars: 1, moon: 1, clouds: 0 },
} as const;

export type SkyTime = keyof typeof SKY;

// Acak deterministik (sama di server & klien) supaya tidak terjadi hydration mismatch.
const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: +(rand(i + 1) * 100).toFixed(2),
  y: +(rand(i + 101) * 65).toFixed(2),
  r: rand(i + 201) > 0.85 ? 1.6 : 1,
}));

export function SkyBackdrop() {
  useGSAP(() => {
    const root = document.documentElement;
    // Palet yang sama dibaca kubah langit WebGL (dunia 3D), jadi tween-nya cukup satu.
    const state = Object.assign(skyState, SKY.morning);
    const apply = () => {
      root.style.setProperty("--sky-top", state.top);
      root.style.setProperty("--sky-bottom", state.bottom);
      root.style.setProperty("--sun", state.sun);
      root.style.setProperty("--sun-x", `${state.sunX}%`);
      root.style.setProperty("--sun-y", `${state.sunY}%`);
      root.style.setProperty("--stars", String(state.stars));
      root.style.setProperty("--sun-o", String(state.sunO));
      root.style.setProperty("--moon-o", String(state.moon));
      root.style.setProperty("--clouds", String(state.clouds));
    };
    apply();

    const goTo = (time: SkyTime) =>
      gsap.to(state, { ...SKY[time], duration: 1.4, ease: "expo.out", overwrite: true, onUpdate: apply });

    // Langit mengikuti babak yang sedang aktif di panggung cerita.
    let last: SkyTime = "morning";
    const sync = () => {
      const { scenes, active } = sceneStore.get();
      const time = scenes[active]?.sky ?? "morning";
      if (time !== last) {
        last = time;
        goTo(time);
      }
    };
    sync();
    const unsubscribe = sceneStore.subscribe(sync);
    return () => {
      unsubscribe();
    };
  });

  return (
    <div aria-hidden className="sky pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ opacity: "var(--stars, 0)" }}>
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, opacity: 0.4 + (i % 4) * 0.15 }}
          />
        ))}
      </div>
      <div
        className="absolute size-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          opacity: "var(--sun-o, 1)",
          left: "var(--sun-x, 18%)",
          top: "var(--sun-y, 34%)",
          background: "var(--sun)",
          boxShadow: "0 0 80px 30px color-mix(in oklab, var(--sun) 45%, transparent)",
        }}
      />
      <div
        className="absolute left-[44%] top-[9%] size-16 rounded-full"
        style={{ opacity: "var(--moon-o, 0)", background: "var(--moon)", boxShadow: "inset -14px -6px 0 0 #d9cfb2" }}
      />
      <div className="absolute inset-0" style={{ opacity: "var(--clouds, 1)" }}>
        <Cloud className="cloud-drift absolute left-[6%] top-[14%] w-40 opacity-90" />
        <Cloud className="cloud-drift-slow absolute left-[58%] top-[8%] w-56 opacity-80" />
        <Cloud className="cloud-drift absolute left-[80%] top-[26%] w-32 opacity-70" />
      </div>
    </div>
  );
}
