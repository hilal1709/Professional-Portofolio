"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { HomeData } from "@/lib/data";
import { cn } from "@/lib/utils";
import { CityLayer, FarHills, NearGround } from "../Landscape";
import type { SkyTime } from "../SkyBackdrop";
import { createCss3d } from "../world/css3d";
import { rig, type Pose } from "../world/rig";
import { restPose, STATIONS } from "../world/stations";
import { World3D } from "../world/World3D";
import { addPassThrough, ForegroundFrame } from "./ForegroundFrame";
import { ANCHORS, sceneStore, STORY_GOTO, type SceneKey, type SceneMeta } from "./sceneStore";
import { AboutScene, buildAbout } from "./scenes/About";
import { buildContact, ContactScene } from "./scenes/Contact";
import { buildExperience, ExperienceScene } from "./scenes/Experience";
import { buildHero, HeroScene } from "./scenes/Hero";
import { buildJourney, JourneyScene } from "./scenes/Journey";
import { buildProjects, ProjectsScene } from "./scenes/Projects";
import { buildReel, ReelScene } from "./scenes/Reel";
import { buildSkills, SkillsScene } from "./scenes/Skills";
import { OVERLAP, type SceneBuild, type SharedBag } from "./types";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, useGSAP);

type SceneDef = SceneMeta & { node: ReactNode; build: SceneBuild };

const SKY: Record<SceneKey, SkyTime> = {
  hero: "morning",
  about: "morning",
  journey: "noon",
  skills: "noon",
  projects: "afternoon",
  reel: "sunset",
  experience: "dusk",
  contact: "night",
};
const ANCHOR_OF = Object.fromEntries(Object.entries(ANCHORS).map(([a, k]) => [k, a])) as Record<SceneKey, string>;

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * Satu panggung sinematik: semua babak adalah lapisan di dalam satu layar yang di-pin sepanjang cerita.
 * Satu master timeline (di-scrub oleh scroll halus) menggerakkan kamera dan transisi antar-babak,
 * jadi pengunjung tidak pernah melihat halaman "bergeser" — mereka dibawa masuk dari satu adegan ke adegan berikutnya.
 */
export function StoryStage({ data }: { data: HomeData }) {
  const stageRef = useRef<HTMLElement>(null);
  const camRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [layoutKey, setLayoutKey] = useState(0);
  const nav = useRef<{ starts: number[]; st?: ScrollTrigger; duration: number }>({ starts: [], duration: 1 });

  const scenes = useMemo<SceneDef[]>(() => {
    const c = data.chapters;
    const show = (k: SceneKey) => c[k]?.visible !== false;
    const t = (k: SceneKey, fallback: string) => c[k]?.title ?? fallback;
    const all: (SceneDef | false)[] = [
      show("hero") && { key: "hero", title: t("hero", "Halo"), node: <HeroScene chapter={c.hero} profile={data.profile} />, build: buildHero, sky: SKY.hero, anchor: "halo" },
      show("about") && { key: "about", title: t("about", "Tentang aku"), node: <AboutScene chapter={c.about} profile={data.profile} />, build: buildAbout, sky: SKY.about, anchor: "tentang" },
      show("journey") &&
        data.milestones.length > 0 && { key: "journey", title: t("journey", "Perjalanan"), node: <JourneyScene chapter={c.journey} milestones={data.milestones} />, build: buildJourney, sky: SKY.journey, anchor: "perjalanan" },
      show("skills") &&
        data.skills.length > 0 && { key: "skills", title: t("skills", "Skill"), node: <SkillsScene chapter={c.skills} skills={data.skills} />, build: buildSkills, sky: SKY.skills, anchor: "skill" },
      show("projects") &&
        data.projects.length > 0 && { key: "projects", title: t("projects", "Proyek"), node: <ProjectsScene chapter={c.projects} projects={data.projects} />, build: buildProjects, sky: SKY.projects, anchor: "proyek" },
      show("reel") && { key: "reel", title: t("reel", "Reel"), node: <ReelScene data={data} />, build: buildReel, sky: SKY.reel, anchor: "reel" },
      show("experience") && {
        key: "experience",
        title: t("experience", "Pengalaman"),
        node: <ExperienceScene chapter={c.experience} experiences={data.experiences} gallery={data.gallery} />,
        build: buildExperience,
        sky: SKY.experience,
        anchor: "pengalaman",
      },
      { key: "contact", title: t("contact", "Kontak"), node: <ContactScene chapter={c.contact} profile={data.profile} />, build: buildContact, sky: SKY.contact, anchor: "kontak" },
    ];
    return all.filter((s): s is SceneDef => Boolean(s));
  }, [data]);

  useEffect(() => {
    sceneStore.setScenes(scenes.map(({ key, title, sky, anchor }) => ({ key, title, sky, anchor })));
  }, [scenes]);

  // Bangun ulang timeline saat lebar layar berubah (tinggi di HP berubah-ubah karena address bar, jadi diabaikan).
  useEffect(() => {
    let w = window.innerWidth;
    let h = window.innerHeight;
    let timer = 0;
    const onResize = () => {
      if (w === 0 || h === 0) {
        w = window.innerWidth;
        h = window.innerHeight;
        setLayoutKey((k) => k + 1);
        return;
      }
      const dw = Math.abs(window.innerWidth - w);
      const dh = Math.abs(window.innerHeight - h);
      if (dw < 2 && (window.innerWidth < 768 || dh < 120)) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        w = window.innerWidth;
        h = window.innerHeight;
        setLayoutKey((k) => k + 1);
      }, 250);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);

  // Tanpa dunia 3D (reduced motion) lanskap 2D adalah satu-satunya latar.
  useEffect(() => {
    if (reduced) document.documentElement.classList.add("world-off");
  }, [reduced]);

  // Scroll halus (inersia) untuk seluruh cerita.
  useGSAP(
    () => {
      if (reduced) return;
      const smoother = ScrollSmoother.create({ wrapper: "#smooth-wrapper", content: "#smooth-content", smooth: 1.2, smoothTouch: 0.1, normalizeScroll: true });
      return () => smoother.kill();
    },
    { dependencies: [reduced] },
  );

  // Master timeline.
  useGSAP(
    () => {
      const stage = stageRef.current!;
      const els = Array.from(stage.querySelectorAll<HTMLElement>(".scene"));
      const bodies = els.map((el) => el.querySelector<HTMLElement>(":scope > .scene-body")!);

      if (reduced) {
        els.forEach((el, i) => ScrollTrigger.create({ trigger: el, start: "top 55%", end: "bottom 55%", onToggle: (self) => self.isActive && sceneStore.setActive(i) }));
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Tab tersembunyi/belum berukuran: tunggu resize berikutnya (yang memicu build ulang).
      if (!vw || !vh) return;
      const mobile = vw < 768;
      const unit = vh * (mobile ? 0.8 : 1);
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      const shared: SharedBag = {};
      const starts: number[] = [];

      // Panel babak ditempel di bidang 3D masing-masing; matriks kamera disinkronkan tiap frame GSAP.
      // Layout diukur dulu dalam mode datar (tanpa transform 3D), lalu kamera mulai di pose babak pertama.
      const css = createCss3d(stage, camRef.current!, els.map((el, i) => ({ el, station: STATIONS[scenes[i].key] })));
      css.setSize(vw, vh);
      const S = css.scale;
      let pose: Pose = restPose(scenes[0].key);
      gsap.set(rig, { ...pose, dx: 0, dz: 0 });
      const fly = (at: number, to: (typeof scenes)[number]["key"] | Pose, dur: number, opts?: { ease?: string; via?: Partial<Pose> }) => {
        const target = typeof to === "string" ? restPose(to) : to;
        if (opts?.via) {
          const mid = { ...target } as Pose;
          (Object.keys(mid) as (keyof Pose)[]).forEach((k) => (mid[k] = opts.via?.[k] ?? (pose[k] + target[k]) / 2));
          tl.to(rig, { keyframes: [{ ...mid, duration: dur / 2, ease: "power1.in" }, { ...target, duration: dur / 2, ease: "power1.out" }] }, at);
        } else {
          tl.to(rig, { ...target, duration: dur, ease: opts?.ease ?? "power2.inOut" }, at);
        }
        pose = target;
      };
      const drift = (at: number, to: { dx?: number; dy?: number; dz?: number }, dur: number, ease = "none") => {
        tl.to(rig, { ...to, duration: dur, ease }, at);
      };

      // Panggung hanya mengatur visibility; opacity sepenuhnya milik animasi tiap adegan
      // (mencampur autoAlpha dengan tween opacity membuat adegan hilang saat scroll mundur).
      gsap.set(els, { visibility: "hidden" });
      gsap.set(els[0], { visibility: "visible" });

      let start = 0;
      els.forEach((el, i) => {
        if (i > 0) tl.set(el, { visibility: "visible" }, start);
        tl.addLabel(scenes[i].key, start);
        starts.push(start);
        const length = scenes[i].build(tl, start, {
          el: bodies[i],
          stage,
          prev: bodies[i - 1] ?? null,
          mobile,
          vw,
          vh,
          shared,
          passThrough: (at, dur) => addPassThrough(tl, at, dur),
          S,
          fly,
          drift,
        });
        if (i < els.length - 1) {
          tl.set(el, { visibility: "hidden" }, start + length);
          start += length - OVERLAP;
        } else {
          start += length;
        }
      });
      tl.to({}, { duration: 0.6 }, start); // jeda penutup sebelum cerita selesai
      css.setFlat(false);
      const syncCss = () => css.update(rig);
      gsap.ticker.add(syncCss, false, false);

      const duration = tl.duration();
      const st = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: () => `+=${duration * unit}`,
        pin: true,
        scrub: 1,
        animation: tl,
        onUpdate(self) {
          const t = self.progress * duration;
          let active = 0;
          starts.forEach((s, i) => {
            if (t >= s + (i ? OVERLAP * 0.5 : 0)) active = i;
          });
          sceneStore.setActive(active);
        },
      });
      nav.current = { starts, st, duration };
      // Hanya untuk debugging lokal (mis. memutar ticker GSAP secara manual di tab tersembunyi).
      if (process.env.NODE_ENV === "development") Object.assign(window, { __story: { gsap, ScrollTrigger, ScrollSmoother, rig, tl, st, starts, keys: scenes.map((s) => s.key) } });

      // Mendarat di babak dari hash URL (mis. kembali dari halaman proyek ke /#proyek).
      const key = ANCHORS[window.location.hash.slice(1)];
      if (key) requestAnimationFrame(() => window.dispatchEvent(new CustomEvent(STORY_GOTO, { detail: key, bubbles: false })));

      return () => {
        gsap.ticker.remove(syncCss);
        css.setFlat(true);
      };
    },
    { dependencies: [reduced, layoutKey, scenes], scope: stageRef, revertOnUpdate: true },
  );

  // Navigasi: tombol nav, HUD, dan link #anchor melompat ke babak tertentu.
  useEffect(() => {
    const goto = (key: SceneKey) => {
      const i = scenes.findIndex((s) => s.key === key);
      if (i === -1) return;
      const { starts, st, duration } = nav.current;
      if (!st || reduced) {
        document.getElementById(scenes[i].anchor)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
        return;
      }
      const t = Math.min(duration, starts[i] + (i ? OVERLAP + 0.05 : 0));
      const y = st.start + (t / duration) * (st.end - st.start);
      const smoother = ScrollSmoother.get();
      if (smoother) smoother.scrollTo(y, true);
      else window.scrollTo({ top: y, behavior: "smooth" });
    };
    const onGoto = (e: Event) => goto((e as CustomEvent<SceneKey>).detail);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='#'], a[href^='/#']");
      if (!a) return;
      const key = ANCHORS[(a.getAttribute("href") ?? "").split("#")[1] ?? ""];
      if (!key) return;
      e.preventDefault();
      history.replaceState(null, "", `#${ANCHOR_OF[key]}`);
      goto(key);
    };
    window.addEventListener(STORY_GOTO, onGoto);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener(STORY_GOTO, onGoto);
      document.removeEventListener("click", onClick, true);
    };
  }, [scenes, reduced]);

  return (
    <>
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <section ref={stageRef} aria-label="Cerita M. Hilal" className={cn("story-stage relative h-dvh w-full overflow-hidden", reduced && "stage-static")}>
            {/* Lanskap 2D: cadangan bila dunia WebGL tidak tersedia (disembunyikan lewat .world-on). */}
            <div className="cam pointer-events-none absolute inset-x-0 top-0 h-dvh" aria-hidden>
              <div className="cam-far absolute inset-x-0 bottom-[22vh] h-[34vh]">
                <FarHills className="cam-intro h-full w-full" />
              </div>
              <div className="cam-city absolute inset-x-0 bottom-[16vh] h-[34vh]">
                <CityLayer className="cam-intro h-full w-full" />
              </div>
              <div className="cam-near absolute inset-x-0 -bottom-[2vh] h-[24vh]">
                <NearGround className="cam-intro h-full w-full" />
              </div>
            </div>
            <div ref={camRef} className="cam3d absolute inset-0">
              {scenes.map((s, i) => (
                <div key={s.key} id={s.anchor} data-scene={s.key} className="scene absolute inset-0" style={{ zIndex: i + 1 }}>
                  <div className="scene-body h-full w-full">{s.node}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      {reduced ? null : (
        <>
          <World3D />
          <ForegroundFrame />
        </>
      )}
    </>
  );
}
