"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { LottiePlayer } from "@/components/LottiePlayer";
import { Mascot, SpeechBubble } from "@/components/mascot/Mascot";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import type { Chapter, Profile } from "@/lib/db/schema";
import scrollHint from "@/lottie/scroll-hint.json";
import { projectPoint } from "../../world/css3d";
import { onPreloaderDone, rig } from "../../world/rig";
import { POINTS, restPose } from "../../world/stations";
import type { SceneBuild } from "../types";

gsap.registerPlugin(useGSAP);

export function HeroScene({ chapter, profile }: { chapter?: Chapter; profile: Profile | null }) {
  const root = useRef<HTMLDivElement>(null);

  // Animasi pembuka (sekali saat halaman tampil), terpisah dari timeline scroll.
  useGSAP(
    (_, contextSafe) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Disembunyikan dulu selama preloader, lalu dimainkan begitu tirai preloader terbuka.
      gsap.set([".hero-title-inner > *", ".hero-mascot-inner"], { opacity: 0 });
      const play = contextSafe!(() => {
        gsap.fromTo(".hero-title-inner > *", { yPercent: 60, opacity: 0, filter: "blur(12px)" }, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "expo.out", stagger: 0.12 });
        gsap.from(".cam-intro", { yPercent: 30, duration: 1.6, ease: "expo.out", stagger: 0.12 });
        gsap.fromTo(".hero-mascot-inner", { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, delay: 0.5, ease: "back.out(1.6)" });
        // Kamera dunia 3D turun dari langit ke kota.
        gsap.fromTo(rig, { dy: 16 }, { dy: 0, duration: 2.2, ease: "expo.out" });
      });
      return onPreloaderDone(play);
    },
    { scope: root },
  );

  const name = profile?.nickname ?? "Hilal";
  return (
    <div ref={root} className="h-full w-full">
      <div className="hero-title absolute inset-x-0 top-[max(13vh,8.5rem)] z-10 mx-auto max-w-5xl px-6 text-center">
        <div className="hero-title-inner">
          <p className="font-display text-lg font-semibold text-sisfor-deep sm:text-xl">
            {profile?.major ?? "Sistem Informasi"} · {profile?.campus ?? "UISI"}
          </p>
          <h1 className="mt-3 font-display text-[clamp(3.2rem,11vw,7.5rem)] font-extrabold leading-[0.9] text-ink">
            {chapter?.title ?? `Aku ${name}`}
            <span className="text-sisfor">.</span>
          </h1>
          {chapter?.body ? (
            <TextGenerateEffect
              words={chapter.body}
              duration={0.6}
              className="mx-auto max-w-2xl font-semibold [&_span]:!text-ink [&_div]:text-lg sm:[&_div]:text-xl"
            />
          ) : null}
        </div>
      </div>

      <div className="hero-mascot absolute bottom-[7vh] left-[8%] z-20 sm:left-[18%]">
        <div className="hero-mascot-inner flex items-end gap-2">
          <Mascot scene="hero" pose="wave" className="aspect-[2/3] h-[30vh] min-h-44 w-auto" />
          {chapter?.mascotLine ? <SpeechBubble className="mb-[22vh] hidden sm:block">{chapter.mascotLine}</SpeechBubble> : null}
        </div>
      </div>

      <div className="hero-hint absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 text-sm font-semibold text-ink">
        <div className="h-12 w-8">
          <LottiePlayer src={scrollHint} autoplay loop className="h-full w-full" aria-label="Gulir ke bawah" />
        </div>
        Terus gulir
      </div>
    </div>
  );
}

/** Hero: maskot berjalan ke kampus, lalu kamera 3D terbang masuk lewat pintu gedung UISI. */
export const buildHero: SceneBuild = (tl, s, ctx) => {
  const stageRect = ctx.stage.getBoundingClientRect();
  // Posisi pintu di layar = proyeksi titik pintu dunia 3D dari pose kamera Hero.
  const door = projectPoint(POINTS.door, restPose("hero"), ctx.vw, ctx.vh);
  const doorX = door.x;
  const doorY = door.y;

  const origin = (sel: string) => {
    const r = ctx.stage.querySelector(sel)?.getBoundingClientRect();
    return r ? `${doorX - (r.left - stageRect.left)}px ${doorY - (r.top - stageRect.top)}px` : "50% 50%";
  };
  const mascot = ctx.el.querySelector(".hero-mascot")!.getBoundingClientRect();
  const walk = Math.max(0, doorX - (mascot.left - stageRect.left + mascot.width * 0.5)) * 0.85;

  // Jalan menuju kampus.
  tl.to(ctx.el.querySelector(".hero-title"), { yPercent: -35, opacity: 0, duration: 1.4, ease: "power1.in" }, s)
    .to(ctx.el.querySelector(".hero-hint"), { opacity: 0, duration: 0.4 }, s)
    .to(ctx.el.querySelector(".hero-mascot"), { x: walk, duration: 1.6, ease: "none" }, s);

  // Kamera terbang ke pintu (dunia 3D); lanskap 2D cadangan ikut "didorong" bila WebGL tidak ada.
  const push = s + 1.3;
  const { x, y, z } = POINTS.door;
  // Layar potret (HP) sempit secara horizontal: kamera dunia 3D mundur dulu agar kota muat, lalu maju saat terbang ke pintu.
  const aspect = ctx.vw / ctx.vh;
  if (aspect < 0.9) tl.fromTo(rig, { dz: Math.min(24, (0.9 / aspect - 1) * 22) }, { dz: 0, duration: 1.2, ease: "power2.in" }, push);
  ctx.fly(push, { px: x, py: y, pz: z + 1.2, tx: x, ty: y, tz: z - 20 }, 1.5, { ease: "power2.in" });
  tl.to(".cam-city", { scale: 9, transformOrigin: origin(".cam-city"), duration: 1.5, ease: "power2.in" }, push)
    .to(".cam-far", { scale: 2.6, transformOrigin: origin(".cam-far"), opacity: 0, duration: 1.3, ease: "power2.in" }, push)
    .to(".cam-near", { scale: 3.2, yPercent: 40, filter: "blur(10px)", opacity: 0, transformOrigin: origin(".cam-near"), duration: 1.1, ease: "power2.in" }, push)
    .to(ctx.el.querySelector(".hero-mascot"), { scale: 3, opacity: 0, filter: "blur(8px)", transformOrigin: "50% 100%", duration: 0.9, ease: "power2.in" }, push)
    .to(".cam-city", { opacity: 0, filter: "blur(6px)", duration: 0.5 }, push + 1.1);
  ctx.passThrough(push + 0.2, 1.2);

  return 3;
};
