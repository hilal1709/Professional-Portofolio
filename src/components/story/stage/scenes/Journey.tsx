"use client";

import { Icon } from "@/components/icons";
import { Mascot, SpeechBubble } from "@/components/mascot/Mascot";
import type { Chapter, Milestone } from "@/lib/db/schema";
import type { SceneBuild } from "../types";

function Tree({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 120" className={className} aria-hidden>
      <rect x="35" y="60" width="10" height="60" fill="#5b4632" />
      <circle cx="40" cy="48" r="32" fill="#4f7442" />
      <circle cx="58" cy="62" r="18" fill="#5f8a4f" />
    </svg>
  );
}

export function JourneyScene({ chapter, milestones }: { chapter?: Chapter; milestones: Milestone[] }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1.5 bg-ink/10">
        <div className="journey-progress h-full origin-left scale-x-0 bg-sisfor" />
      </div>

      <div className="journey-track relative flex h-full w-max flex-row">
        <div className="journey-ground absolute inset-x-0 bottom-0 h-[22vh]" aria-hidden>
          <div className="absolute inset-x-0 top-0 h-10 bg-[#6f8f5a]" />
          <div className="absolute inset-x-0 bottom-0 top-8 bg-khaki" />
          <div className="absolute inset-x-0 top-[55%] border-t-4 border-dashed border-paper/90" />
        </div>

        <div className="relative flex h-full w-screen shrink-0 flex-col justify-center px-6 pb-[30vh] md:w-[62vw] md:px-[8vw] md:pb-[26vh]">
          <h2 className="font-display text-[clamp(2.4rem,6vw,5.2rem)] font-extrabold leading-[0.92] text-ink">{chapter?.title ?? "Perjalanan di UISI"}</h2>
          {chapter?.body ? <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-ink/80 sm:text-lg">{chapter.body}</p> : null}
        </div>

        {milestones.map((m, i) => (
          <div key={m.id} className="relative flex h-full w-[82vw] shrink-0 items-end px-5 pb-[19vh] md:w-[38vw] md:min-w-[380px] md:px-[3vw]">
            <Tree className={`absolute bottom-[19vh] h-32 md:h-40 ${i % 2 ? "right-6" : "right-[40%]"} opacity-90`} />
            <div className="journey-sign relative w-full max-w-sm">
              <div className="rounded-2xl bg-[#fbf3e4] p-5 shadow-[0_18px_40px_-20px_rgba(34,28,24,0.55)] ring-1 ring-[#e3d3b8] sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="tabular font-display text-4xl font-extrabold text-sisfor sm:text-5xl">{m.year}</span>
                  <span className="grid size-11 place-items-center rounded-full bg-sisfor/10 text-sisfor">
                    <Icon name={m.icon} />
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl font-bold leading-tight text-ink sm:text-2xl">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:text-base">{m.description}</p>
              </div>
              <div className="journey-pole mx-auto h-[10vh] w-3 rounded-b bg-[#7a5a3c]" aria-hidden />
            </div>
          </div>
        ))}
        <div className="w-[40vw] shrink-0 md:w-[30vw]" aria-hidden />
      </div>

      <div className="journey-mascot pointer-events-none absolute bottom-[8vh] left-[4%] z-10 flex items-end gap-2 md:left-[14%]">
        <Mascot scene="journey" pose="walk" backpack className="aspect-[2/3] h-[20vh] min-h-32 md:h-[24vh]" />
        {chapter?.mascotLine ? <SpeechBubble className="journey-bubble mb-[16vh] hidden max-w-[12rem] text-xs sm:block md:mb-[19vh] md:text-sm">{chapter.mascotLine}</SpeechBubble> : null}
      </div>
    </div>
  );
}

/** Perjalanan: kamera turun ke jalan siang, papan milestone bergeser sementara dunia 3D ikut ber-parallax, lalu zoom masuk ke ransel. */
export const buildJourney: SceneBuild = (tl, s, ctx) => {
  const track = ctx.el.querySelector<HTMLElement>(".journey-track")!;
  const distance = Math.max(0, track.scrollWidth - ctx.vw);
  const D = Math.max(2, (distance / ctx.vh) * 1.3);
  const stageRect = ctx.stage.getBoundingClientRect();
  // Ukur dulu sebelum tween `from` menggeser posisi.
  const mascot = ctx.el.querySelector<HTMLElement>(".journey-mascot")!;
  const box = mascot.getBoundingClientRect();
  const m = mascot.querySelector(".mascot")!.getBoundingClientRect();
  const packX = m.left + m.width * 0.2;
  const packY = m.top + m.height * 0.6;
  ctx.shared.packPoint = { x: packX - stageRect.left, y: packY - stageRect.top };
  const trackLeft = track.getBoundingClientRect().left;
  const signLefts = Array.from(ctx.el.querySelectorAll<HTMLElement>(".journey-sign"), (el) => [el, el.getBoundingClientRect().left - trackLeft] as const);

  // Masuk: kamera keluar lewat atap kampus lalu turun ke jalan; papan naik dari bawah, maskot dari kiri.
  ctx.fly(s, "journey", 1.4, { via: { py: 24 } });
  tl.fromTo(ctx.el, { opacity: 0 }, { opacity: 1, duration: 0.4 }, s + 0.6)
    .fromTo(track, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, s + 0.6)
    .from(mascot, { xPercent: -160, duration: 0.8, ease: "power2.out" }, s + 0.8);

  // Bergeser horizontal: track DOM dan kamera dunia 3D bergerak sejauh yang sama → parallax alami.
  const move = s + 1.4;
  tl.to(track, { x: -distance, duration: D, ease: "none" }, move).fromTo(ctx.el.querySelector(".journey-progress"), { scaleX: 0 }, { scaleX: 1, duration: D, ease: "none" }, move);
  ctx.drift(move, { dx: distance / ctx.S }, D);
  signLefts.forEach(([sign, left]) => {
    const t = move + (distance ? ((left - ctx.vw * 0.8) / distance) * D : 0);
    tl.from(sign, { yPercent: 45, rotate: -10, opacity: 0, duration: 0.45, ease: "back.out(1.7)" }, Math.max(s + 0.9, t));
  });

  // Keluar: zoom masuk ke ransel maskot.
  const out = move + D;
  tl.to(ctx.el.querySelector(".journey-bubble"), { opacity: 0, duration: 0.2 }, out)
    .to(track, { opacity: 0, yPercent: 20, duration: 0.8, ease: "power2.in" }, out + 0.2)
    .to(mascot, { scale: 14, transformOrigin: `${packX - box.left}px ${packY - box.top}px`, duration: 1.4, ease: "power3.in" }, out);
  ctx.passThrough(out + 0.3, 1.1);
  return 1.4 + D + 1.6;
};
