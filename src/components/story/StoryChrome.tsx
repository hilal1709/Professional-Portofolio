"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { SiteBanner } from "./SiteBanner";
import { useSceneState, type SceneKey } from "./stage/sceneStore";

const SHORT: Partial<Record<SceneKey, string>> = {
  about: "Tentang",
  journey: "Perjalanan",
  skills: "Skill",
  projects: "Proyek",
  reel: "Reel",
  experience: "Pengalaman",
};

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** HUD babak: "Babak 3 / 8 · Judul" + titik-titik yang bisa diklik untuk melompat. */
function ChapterHUD() {
  const { scenes, active } = useSceneState();
  if (scenes.length === 0) return null;
  const current = scenes[active];
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2 sm:bottom-6">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-paper/88 py-1.5 pl-4 pr-2 text-ink shadow-[0_12px_30px_-16px_rgba(34,28,24,0.6)] backdrop-blur-md">
        <p className="tabular whitespace-nowrap text-xs font-semibold sm:text-sm" aria-live="polite">
          <span className="text-sisfor">Babak {active + 1}</span>
          <span className="text-ink-soft"> / {scenes.length}</span>
          <span className="hidden sm:inline"> · {current?.title}</span>
        </p>
        <ol className="flex items-center gap-1" aria-label="Lompat ke babak">
          {scenes.map((s, i) => (
            <li key={s.key}>
              <a
                href={`#${s.anchor}`}
                aria-label={`Babak ${i + 1}: ${s.title}`}
                aria-current={i === active ? "step" : undefined}
                className="grid size-6 place-items-center rounded-full"
              >
                <span className={cn("block rounded-full transition-all duration-300", i === active ? "h-2.5 w-5 bg-sisfor" : "size-2 bg-ink/25 hover:bg-ink/50")} />
              </a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Navigasi tetap + progress bar + HUD babak. Link #anchor ditangani panggung cerita (StoryStage). */
export function StoryChrome({ name, banner }: { name: string; banner?: { text: string; cta: string; url: string } | null }) {
  const { scenes } = useSceneState();
  const links = scenes.filter((s) => SHORT[s.key]);

  useGSAP(() => {
    gsap.to(".story-progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
  });

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 h-1" aria-hidden>
        <div className="story-progress h-full origin-left scale-x-0 bg-sisfor" />
      </div>
      <header className="fixed inset-x-0 top-3 z-40 flex flex-col gap-2 px-3 sm:px-4">
        {banner?.text ? <SiteBanner {...banner} /> : null}
        <nav
          aria-label="Babak cerita"
          className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-full bg-paper/85 py-2 pl-5 pr-2 shadow-[0_10px_30px_-18px_rgba(34,28,24,0.5)] backdrop-blur-md"
        >
          <a href="#halo" className="font-display text-xl font-extrabold text-ink">
            {name}
            <span className="text-sisfor">.</span>
          </a>
          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((s) => (
              <li key={s.key}>
                <a href={`#${s.anchor}`} className="rounded-full px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink">
                  {SHORT[s.key]}
                </a>
              </li>
            ))}
          </ul>
          <a href="#kontak" className="rounded-full bg-sisfor px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-sisfor-deep">
            Hubungi aku
          </a>
        </nav>
      </header>
      <ChapterHUD />
    </>
  );
}
