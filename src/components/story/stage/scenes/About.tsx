"use client";

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import Image from "next/image";
import { Mascot, SpeechBubble } from "@/components/mascot/Mascot";
import type { Chapter, Profile } from "@/lib/db/schema";
import type { SceneBuild } from "../types";

gsap.registerPlugin(SplitText);

export function AboutScene({ chapter, profile }: { chapter?: Chapter; profile: Profile | null }) {
  const facts = profile
    ? [
        ["Kampus", profile.campus],
        ["Program studi", profile.major],
        ["Angkatan", profile.batch],
        ["Domisili", profile.location],
      ].filter(([, v]) => v)
    : [];

  return (
    <div className="about-room flex h-full w-full items-center justify-center bg-[radial-gradient(120%_90%_at_50%_10%,#fbf3e4_0%,#eadfcb_70%,#dccbb0_100%)] px-4 pb-20 pt-24 sm:px-6 sm:pt-28">
      <div className="about-card relative grid w-full max-w-6xl items-center gap-5 sm:gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <div className="relative mx-auto w-[min(62vw,22rem)] lg:w-full">
          <div className="about-photo relative aspect-[4/5] max-h-[22dvh] overflow-hidden rounded-[24px] bg-paper-deep shadow-[0_30px_60px_-30px_rgba(34,28,24,0.6)] max-lg:mx-auto max-lg:w-auto lg:max-h-[68dvh]">
            <Image
              src={profile?.photo || "/images/me-1.jpg"}
              alt={`Foto ${profile?.name ?? "Hilal"}`}
              fill
              sizes="(min-width: 1024px) 34vw, 62vw"
              className="object-cover object-[50%_30%]"
            />
          </div>
          <div className="about-mascot absolute -bottom-6 -left-10 hidden items-end lg:flex">
            <Mascot scene="about" pose="point" className="aspect-[2/3] h-44" />
            {chapter?.mascotLine ? <SpeechBubble className="-ml-6 mb-32 max-w-[14rem] text-sm">{chapter.mascotLine}</SpeechBubble> : null}
          </div>
        </div>

        <div className="min-w-0">
          <h2 className="about-title font-display text-[clamp(2rem,5vw,4rem)] font-extrabold leading-[0.95] text-ink">{chapter?.title ?? "Kenalan dulu, yuk"}</h2>
          <p className="about-bio mt-2 max-w-[62ch] text-[0.88rem] leading-normal text-ink-soft sm:mt-5 sm:text-lg">{profile?.bio}</p>
          {chapter?.body ? <p className="about-body mt-3 hidden max-w-[62ch] text-lg leading-relaxed text-ink-soft lg:block">{chapter.body}</p> : null}
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border pt-3 sm:mt-8 sm:gap-y-5 sm:pt-6">
            {facts.map(([k, v]) => (
              <div key={k} className="about-fact">
                <dt className="text-xs font-semibold text-sisfor sm:text-sm">{k}</dt>
                <dd className="mt-0.5 font-display text-sm font-semibold leading-tight text-ink sm:text-lg">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

/** Tentang: portal lingkaran terbuka dari pintu kampus, foto "tirai", teks naik baris demi baris. */
export const buildAbout: SceneBuild = (tl, s, ctx) => {
  const q = <T extends Element = HTMLElement>(sel: string) => ctx.el.querySelector<T & HTMLElement>(sel);
  const p = ctx.shared.doorPoint ?? { x: ctx.vw / 2, y: ctx.vh / 2 };
  const at = `${p.x}px ${p.y}px`;

  tl.fromTo(ctx.el, { clipPath: `circle(0% at ${at})` }, { clipPath: `circle(150% at ${at})`, duration: 1.1, ease: "power2.inOut" }, s)
    .fromTo(q(".about-card"), { scale: 0.86, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 1, ease: "power2.out" }, s + 0.2)
    .fromTo(q(".about-photo"), { clipPath: "inset(45% 35% 45% 35% round 24px)" }, { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1, ease: "power2.inOut" }, s + 0.6)
    .fromTo(q(".about-photo img"), { scale: 1.35 }, { scale: 1, duration: 1.6, ease: "power1.out" }, s + 0.6);

  const title = q(".about-title");
  if (title) tl.from(SplitText.create(title, { type: "words", mask: "words" }).words, { yPercent: 110, duration: 0.5, stagger: 0.06, ease: "power3.out" }, s + 1.2);
  const bio = q(".about-bio");
  if (bio) tl.from(SplitText.create(bio, { type: "lines", mask: "lines" }).lines, { yPercent: 110, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }, s + 1.5);
  const body = q(".about-body");
  if (body) tl.from(body, { y: 24, opacity: 0, duration: 0.5 }, s + 2.1);
  tl.from(ctx.el.querySelectorAll(".about-fact"), { y: 20, opacity: 0, duration: 0.4, stagger: 0.12 }, s + 2.3);
  const mascot = q(".about-mascot");
  if (mascot) tl.from(mascot, { xPercent: -80, opacity: 0, duration: 0.7, ease: "back.out(1.4)" }, s + 2.4);

  // Keluar: kartu mengecil & naik, ruangan memudar ke langit siang.
  const out = s + 3.6;
  tl.to(q(".about-card"), { scale: 0.4, yPercent: -60, rotate: -5, opacity: 0, duration: 1, ease: "power2.in" }, out).to(ctx.el, { opacity: 0, duration: 0.8 }, out + 0.2);
  return 4.6;
};
