"use client";

import { Icon } from "@/components/icons";
import { Mascot, SpeechBubble } from "@/components/mascot/Mascot";
import type { Chapter, Skill } from "@/lib/db/schema";
import type { SceneBuild } from "../types";

export function groupSkills(skills: Skill[]) {
  return Object.entries(
    skills.reduce<Record<string, Skill[]>>((acc, s) => {
      (acc[s.category] ??= []).push(s);
      return acc;
    }, {}),
  );
}

export function SkillsScene({ chapter, skills }: { chapter?: Chapter; skills: Skill[] }) {
  const groups = groupSkills(skills);
  return (
    <div className="skills-bag relative flex h-full w-full items-center justify-center px-4 pb-20 pt-24 text-paper sm:px-8 sm:pt-28">
      {/* Kain ransel: buram saat portal terbuka, lalu menipis agar bagian dalam ransel 3D terlihat. */}
      <div className="skills-bg absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_45%,#5a3d2b_0%,#3a281d_70%,#2a1c14_100%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-3 rounded-[28px] border-2 border-dashed border-[#c9a77a]/35 sm:inset-6" aria-hidden />
      <div className="relative grid w-full max-w-6xl items-center gap-6 lg:grid-cols-[19rem_1fr] lg:gap-12">
        <div className="skills-head">
          <h2 className="font-display text-[clamp(2.2rem,5vw,4rem)] font-extrabold leading-[0.95]">{chapter?.title ?? "Isi ranselku"}</h2>
          {chapter?.body ? <p className="mt-3 text-base leading-relaxed text-paper/80 sm:text-lg">{chapter.body}</p> : null}
          <p className="tabular mt-4 font-display text-sm font-semibold text-[#e7c79c]">
            Kantong <span className="skills-count">1</span> / {groups.length}
          </p>
          <div className="mt-6 hidden items-end gap-1 lg:flex">
            <Mascot scene="skills" pose="cheer" className="aspect-[2/3] h-40" />
            {chapter?.mascotLine ? <SpeechBubble className="mb-28 text-xs">{chapter.mascotLine}</SpeechBubble> : null}
          </div>
        </div>

        <div className="relative grid min-h-[22rem]">
          {groups.map(([category, items], gi) => (
            <section key={category} className="skill-pocket col-start-1 row-start-1 self-center rounded-3xl bg-[#fbf3e4] p-5 text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] sm:p-8" data-index={gi}>
              <h3 className="border-b-2 border-ink pb-2 font-display text-2xl font-bold sm:text-3xl">{category}</h3>
              <ul className="mt-1">
                {items.map((s) => (
                  <li key={s.id} className="border-b border-border py-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <Icon name={s.icon} size={20} className="shrink-0 text-sisfor" />
                      <span className="flex-1 font-semibold">{s.name}</span>
                      <span className="tabular text-sm font-semibold text-ink-soft">{s.level}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-deep" role="presentation">
                      <div className="skill-bar h-full origin-left rounded-full bg-sisfor" style={{ width: `${s.level}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skill: portal terbuka dari ransel, kamera pindah ke dalam ransel 3D; tiap kategori tampil bergantian seperti kantong yang dibuka. */
export const buildSkills: SceneBuild = (tl, s, ctx) => {
  const p = ctx.shared.packPoint ?? { x: ctx.vw / 2, y: ctx.vh / 2 };
  const at = `${p.x}px ${p.y}px`;
  const pockets = Array.from(ctx.el.querySelectorAll<HTMLElement>(".skill-pocket"));
  const counter = ctx.el.querySelector(".skills-count");
  const STEP = 1.1;

  tl.fromTo(ctx.el, { clipPath: `circle(0% at ${at})` }, { clipPath: `circle(150% at ${at})`, duration: 1.1, ease: "power2.inOut" }, s)
    .from(ctx.el.querySelector(".skills-head"), { y: 40, opacity: 0, duration: 0.7, ease: "power2.out" }, s + 0.5);
  // Saat portal menutupi layar penuh, kamera dipindah ke dalam ransel, lalu kainnya menipis.
  ctx.fly(s + 1, "skills", 0.05, { ease: "none" });
  ctx.drift(s + 1, { dx: 0 }, 0.05);
  tl.fromTo(ctx.el.querySelector(".skills-bg"), { "--bag": 1 }, { "--bag": 0.45, duration: 0.7, ease: "power1.out" }, s + 1.1);

  pockets.forEach((pocket, i) => {
    const t = s + 1 + i * STEP;
    // Barang di dalam ransel ikut bergeser sedikit tiap kantong berganti.
    if (i > 0) ctx.drift(t - 0.2, { dx: (i % 2 ? 1 : -1) * 1.2 }, 0.6, "power2.inOut");
    if (i > 0) tl.fromTo(pocket, { yPercent: 35, rotate: 4, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, t);
    else tl.fromTo(pocket, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }, s + 0.6);
    tl.fromTo(pocket.querySelectorAll(".skill-bar"), { scaleX: 0 }, { scaleX: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" }, t + 0.1);
    if (counter) tl.set(counter, { textContent: String(i + 1) }, t);
    if (i < pockets.length - 1) tl.to(pocket, { yPercent: -30, rotate: -4, opacity: 0, duration: 0.35, ease: "power2.in" }, t + STEP - 0.35);
  });

  // Keluar: isi memudar saat kamera mundur keluar dari ransel menuju galeri sore.
  const out = s + 1 + pockets.length * STEP;
  tl.to(ctx.el, { opacity: 0, scale: 0.92, duration: 0.6, ease: "power2.in" }, out);
  return 1 + pockets.length * STEP + 1;
};
