"use client";

import { PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Mascot, SpeechBubble } from "@/components/mascot/Mascot";
import { MascotSvg } from "@/components/mascot/MascotSvg";
import type { HomeData } from "@/lib/data";
import { toShowreelProps } from "@/remotion/fromData";
import { useSceneNear } from "../sceneStore";
import type { SceneBuild } from "../types";

const ReelPlayer = dynamic(() => import("../../ReelPlayer"), { ssr: false });

/** Poster ringan selama Remotion belum dimuat — bentuknya sama dengan frame pembuka video. */
function Poster({ name, tagline, loading }: { name: string; tagline: string; loading: boolean }) {
  return (
    <div className="relative flex aspect-video w-full items-center justify-center gap-[5%] bg-paper px-[6%] text-ink">
      <MascotSvg armR={-135} armL={6} className="h-[58%] w-auto shrink-0" title="" />
      <div className="min-w-0">
        <p className="font-display text-[clamp(0.9rem,2.6vw,2rem)] font-bold text-sisfor">Halo, aku</p>
        <p className="font-display text-[clamp(1.8rem,7vw,5.6rem)] font-extrabold leading-[0.92]">{name}</p>
        <p className="mt-2 hidden max-w-[40ch] text-[clamp(0.8rem,1.6vw,1.3rem)] text-ink-soft sm:block">{tagline}</p>
      </div>
      <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-semibold text-paper">
        <HugeiconsIcon icon={PlayIcon} size={14} />
        {loading ? "Menyiapkan video…" : "Video"}
      </span>
    </div>
  );
}

export function ReelScene({ data }: { data: HomeData }) {
  const chapter = data.chapters.reel;
  const inputProps = useMemo(() => toShowreelProps(data), [data]);
  // Remotion (paket terbesar) baru dimuat saat babak ini mendekat.
  const near = useSceneNear("reel", 1);

  return (
    <div className="flex h-full w-full items-center justify-center px-4 pb-20 pt-24 text-paper sm:px-6 sm:pt-28">
      <div className="w-full max-w-5xl">
        <div className="reel-head flex items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-extrabold leading-[0.95]">{chapter?.title ?? "Cerita dalam gerak"}</h2>
            {chapter?.body ? <p className="mt-2 max-w-[52ch] text-base leading-relaxed text-paper/85 sm:text-lg">{chapter.body}</p> : null}
          </div>
          <div className="hidden items-end gap-1 lg:flex">
            {chapter?.mascotLine ? <SpeechBubble side="right" className="mb-24">{chapter.mascotLine}</SpeechBubble> : null}
            <Mascot scene="reel" pose="point" className="aspect-[2/3] h-32 -scale-x-100" />
          </div>
        </div>

        <div className="reel-frame relative mx-auto mt-5 w-full max-w-[min(100%,calc((100dvh-21rem)*16/9))] overflow-hidden rounded-2xl bg-ink shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)] ring-1 ring-white/10 sm:mt-8">
          <Poster name={inputProps.name} tagline={inputProps.tagline} loading={near} />
          {near ? (
            <div className="absolute inset-0">
              <ReelPlayer inputProps={inputProps} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Reel: kartu proyek terakhir membesar menjadi bingkai video. */
export const buildReel: SceneBuild = (tl, s, ctx) => {
  const frame = ctx.el.querySelector<HTMLElement>(".reel-frame")!;
  const stageRect = ctx.stage.getBoundingClientRect();
  const f = frame.getBoundingClientRect();
  const card = ctx.shared.lastCardRect;

  if (card) {
    const fx = f.left - stageRect.left;
    const fy = f.top - stageRect.top;
    tl.fromTo(
      frame,
      { x: card.x - fx, y: card.y - fy, scaleX: card.width / f.width, scaleY: card.height / f.height, transformOrigin: "0 0", borderRadius: 24 },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 16, duration: 1.2, ease: "power3.inOut" },
      s,
    );
  } else {
    tl.fromTo(frame, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: "power2.out" }, s);
  }
  tl.from(ctx.el.querySelector(".reel-head"), { y: 40, opacity: 0, duration: 0.6, ease: "power2.out" }, s + 0.8);

  // Ditahan cukup lama untuk menonton, lalu bingkai mengecil seperti kartu galeri.
  const out = s + 3.2;
  tl.to(frame, { scale: 0.45, yPercent: 40, rotate: 6, opacity: 0, duration: 1, ease: "power2.in" }, out).to(ctx.el.querySelector(".reel-head"), { yPercent: -60, opacity: 0, duration: 0.7 }, out);
  return 4.2;
};
