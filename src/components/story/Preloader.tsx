"use client";

import { animate, createTimeline, stagger, svg } from "animejs";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/mascot/Mascot";
import { Progress } from "@/components/ui/progress";
import { PRELOADER_SEEN_KEY } from "./preloaderSkip";
import { PRELOADER_DONE, WORLD_READY, worldFlags } from "./world/rig";

/** Batas tunggu: HP lambat tetap masuk; dunia 3D menyusul dengan fade-in. */
const MAX_WAIT = 4000;

const STEPS = [
  { at: 0, text: "Menggambar kota Gresik…" },
  { at: 35, text: "Menyalakan pabrik semen…" },
  { at: 65, text: "Membuka pintu kampus UISI…" },
  { at: 95, text: "Siap jalan-jalan!" },
];

function finish() {
  worldFlags.preloaderDone = true;
  ScrollSmoother.get()?.paused(false);
  window.dispatchEvent(new CustomEvent(PRELOADER_DONE));
}

/**
 * Layar pembuka: siluet kota "digambar" garis demi garis (anime.js), maskot melambai,
 * dan progres nyata (font, gambar, dunia 3D) lewat Progress shadcn. Tampil sekali per sesi.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem(PRELOADER_SEEN_KEY));
    } catch {}
    if (seen) {
      // Sembunyikan lewat CSS (.preloader-skip) lalu lepas dari DOM supaya maskotnya tidak terus beranimasi.
      document.documentElement.classList.add("preloader-skip");
      queueMicrotask(() => setGone(true));
      finish();
      return;
    }

    // Jangan biarkan cerita ter-scroll di balik tirai.
    const pause = window.setInterval(() => ScrollSmoother.get()?.paused(true), 50);

    const shown = { v: 0 };
    let target = 0;
    let closed = false;
    const anims: { revert?: () => void; pause?: () => void }[] = [];
    const bump = (n: number) => {
      target = Math.min(100, target + n);
      anims.push(animate(shown, { v: target, duration: 600, ease: "outQuad", onUpdate: () => setProgress(Math.round(shown.v)) }));
      if (target >= 100) window.setTimeout(close, reduced ? 150 : 650);
    };

    if (!reduced) {
      const lines = svg.createDrawable(el.querySelectorAll(".pl-line"));
      anims.push(animate(lines, { draw: ["0 0", "0 1"], duration: 1400, delay: stagger(90), ease: "inOutQuad" }));
      anims.push(animate(el.querySelectorAll(".pl-window"), { opacity: [0, 1], scale: [0.4, 1], duration: 400, delay: stagger(40, { start: 900 }), ease: "outBack" }));
      anims.push(animate(el.querySelectorAll(".pl-smoke"), { translateY: [0, -14], opacity: [0.8, 0], duration: 1600, delay: stagger(400), loop: true, ease: "outSine" }));
    }

    const done = new Set<string>();
    const step = (key: string, n: number) => {
      if (done.has(key)) return;
      done.add(key);
      bump(n);
    };
    window.setTimeout(() => step("min", 15), reduced ? 0 : 900);
    document.fonts.ready.then(() => step("fonts", 20));
    if (document.readyState === "complete") step("load", 25);
    else window.addEventListener("load", () => step("load", 25), { once: true });
    if (reduced || worldFlags.ready || worldFlags.failed) step("world", 40);
    else window.addEventListener(WORLD_READY, () => step("world", 40), { once: true });
    const timeout = window.setTimeout(() => {
      done.clear();
      target = 99;
      bump(1);
    }, MAX_WAIT);

    function close() {
      if (closed) return;
      closed = true;
      window.clearInterval(pause);
      window.clearTimeout(timeout);
      try {
        sessionStorage.setItem(PRELOADER_SEEN_KEY, "1");
      } catch {}
      if (reduced) {
        anims.push(animate(el, { opacity: 0, duration: 200, onComplete: () => setGone(true) }));
        finish();
        return;
      }
      const tl = createTimeline({ onComplete: () => setGone(true) });
      tl.add(el.querySelector(".pl-content")!, { opacity: 0, translateY: -24, duration: 380, ease: "inQuad" })
        .add(el.querySelector(".pl-top")!, { translateY: "-100%", duration: 750, ease: "inOutExpo" }, "-=80")
        .add(el.querySelector(".pl-bottom")!, { translateY: "100%", duration: 750, ease: "inOutExpo" }, "<<")
        // Animasi pembuka Hero dimulai saat tirai mulai membuka.
        .call(finish, "<<+=200");
      anims.push(tl);
    }

    return () => {
      window.clearInterval(pause);
      window.clearTimeout(timeout);
      anims.forEach((a) => a.pause?.());
    };
  }, []);

  if (gone) return null;
  const status = [...STEPS].reverse().find((s) => progress >= s.at)?.text ?? STEPS[0].text;

  return (
    <div ref={root} className="preloader fixed inset-0 z-[60] overflow-hidden" role="status" aria-live="polite" aria-label="Memuat portofolio">
      <div className="pl-top absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,#9fd0ef_0%,#cfe2e6_100%)]" />
      <div className="pl-bottom absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,#cfe2e6_0%,#f9e7c8_100%)]" />

      <div className="pl-content relative flex h-full flex-col items-center justify-center px-6">
        <div className="flex items-end gap-2">
          <Mascot pose="wave" className="aspect-[2/3] h-28 sm:h-32" />
          <svg viewBox="0 0 360 140" className="h-auto w-[min(72vw,22rem)] overflow-visible" aria-hidden>
            <g fill="none" stroke="#221c18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Pabrik semen: silo, menara, cerobong */}
              <path className="pl-line" d="M14 138 V70 a10 4 0 0 1 20 0 V138 M38 138 V60 a10 4 0 0 1 20 0 V138" />
              <path className="pl-line" d="M66 138 V34 H90 V138 M62 58 H94 M62 82 H94 M62 106 H94" />
              <path className="pl-line" d="M104 138 V22 H114 V138" />
              {/* Kampus UISI */}
              <path className="pl-line" d="M130 138 V66 H262 V138 M126 66 H266 M170 66 V50 H222 V66" />
              <path className="pl-line" stroke="#a3191f" d="M184 138 V108 H208 V138" />
              {/* Masjid */}
              <path className="pl-line" d="M278 138 V96 H330 V138 M284 96 Q304 60 324 96 M338 138 V52 M334 52 L338 40 L342 52" />
              <path className="pl-line" stroke="#a3191f" strokeWidth="3" d="M2 138 H358" />
            </g>
            <g fill="#f7e9c8" stroke="#221c18" strokeWidth="1.2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect key={i} className="pl-window" x={142 + i * 19} y={78} width="10" height="10" rx="1.5" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
              ))}
            </g>
            <g fill="#ffffff" stroke="#221c18" strokeWidth="1.2">
              <circle className="pl-smoke" cx="109" cy="14" r="5" />
              <circle className="pl-smoke" cx="115" cy="10" r="6" />
            </g>
          </svg>
        </div>

        <p className="mt-6 font-display text-3xl font-extrabold text-ink">
          Hilal<span className="text-sisfor">.</span>
        </p>
        <Progress value={progress} className="mt-4 w-[min(72vw,20rem)] [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-ink/10" aria-label="Progres memuat" />
        <p className="tabular mt-3 flex w-[min(72vw,20rem)] justify-between text-sm font-semibold text-ink-soft">
          <span>{status}</span>
          <span>{progress}%</span>
        </p>
      </div>
    </div>
  );
}
