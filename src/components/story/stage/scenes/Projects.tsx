"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Mascot, SpeechBubble } from "@/components/mascot/Mascot";
import { ProjectCover } from "@/components/ProjectCover";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { Badge } from "@/components/ui/badge";
import type { Chapter, Project } from "@/lib/db/schema";
import type { SceneBuild } from "../types";

function ProjectCard({ project }: { project: Project }) {
  return (
    <CardContainer containerClassName="py-0" className="w-full">
      <CardBody className="group/card relative h-auto w-full rounded-2xl bg-[#fbf7f0] p-4 shadow-[0_24px_60px_-30px_rgba(34,28,24,0.6)]">
        <CardItem translateZ={60} className="w-full">
          <ProjectCover project={project} className="aspect-[16/10] w-full rounded-xl" />
        </CardItem>
        <CardItem translateZ={40} className="mt-4 px-1">
          <p className="text-sm font-semibold text-sisfor">
            {project.role} · {project.year}
          </p>
          <h3 className="mt-1 font-display text-xl font-bold leading-tight text-ink sm:text-2xl">{project.title}</h3>
        </CardItem>
        <CardItem translateZ={30} as="p" className="mt-2 line-clamp-3 px-1 text-sm leading-relaxed text-ink-soft sm:text-base">
          {project.summary}
        </CardItem>
        <CardItem translateZ={20} className="mt-3 flex w-full flex-wrap gap-2 px-1">
          {project.tech.map((t) => (
            <Badge key={t} variant="secondary" className="h-6 bg-paper-deep px-3 font-semibold text-ink">
              {t}
            </Badge>
          ))}
        </CardItem>
        <CardItem translateZ={50} className="mt-4 px-1 pb-1">
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-sisfor"
          >
            Lihat cerita proyek
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
          </Link>
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}

export function ProjectsScene({ chapter, projects }: { chapter?: Chapter; projects: Project[] }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="projects-track relative flex h-full w-max items-center pt-16">
        <div className="flex h-full w-screen shrink-0 flex-col justify-center px-6 md:w-[46vw] md:pl-[8vw] md:pr-[4vw]">
          <h2 className="font-display text-[clamp(2.4rem,5.4vw,5rem)] font-extrabold leading-[0.92] text-ink">{chapter?.title ?? "Hal-hal yang sudah kubangun"}</h2>
          {chapter?.body ? <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-ink/80 sm:text-lg">{chapter.body}</p> : null}
          <div className="mt-6 flex items-end gap-1">
            <Mascot scene="projects" pose="point" className="aspect-[2/3] h-32 sm:h-44" />
            {chapter?.mascotLine ? <SpeechBubble className="mb-24 sm:mb-32">{chapter.mascotLine}</SpeechBubble> : null}
          </div>
        </div>
        {projects.map((p) => (
          <div key={p.id} className="project-slot w-[80vw] shrink-0 px-3 sm:w-[min(32rem,40vw)] sm:px-6">
            <ProjectCard project={p} />
          </div>
        ))}
        <div className="w-[10vw] shrink-0" aria-hidden />
      </div>
    </div>
  );
}

/** Proyek: kamera keluar dari ransel ke galeri sore, lalu kartu bergeser horizontal sementara galeri 3D ber-parallax. */
export const buildProjects: SceneBuild = (tl, s, ctx) => {
  const track = ctx.el.querySelector<HTMLElement>(".projects-track")!;
  const distance = Math.max(0, track.scrollWidth - ctx.vw);
  const D = Math.max(1.5, (distance / ctx.vh) * 1.3);
  const slots = Array.from(ctx.el.querySelectorAll<HTMLElement>(".project-slot"));
  const stageRect = ctx.stage.getBoundingClientRect();
  const last = slots.at(-1)?.getBoundingClientRect();
  if (last) {
    ctx.shared.lastCardRect = new DOMRect(last.left - stageRect.left - distance, last.top - stageRect.top, last.width, last.height);
  }

  ctx.fly(s, "projects", 1.3, { via: { px: 30, py: 20, pz: -225 } });
  ctx.drift(s, { dx: 0 }, 0.6, "power1.out");
  tl.fromTo(ctx.el, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, s + 0.6)
    .fromTo(track, { xPercent: 6 }, { xPercent: 0, duration: 0.8, ease: "power3.out" }, s + 0.5)
    // Cakrawala 2D cadangan kembali di kejauhan.
    .to(".cam-far", { scale: 1, opacity: 0.85, yPercent: 30, filter: "blur(0px)", duration: 0.8 }, s + 1);

  // Track bergeser ke kanan-panel = arah -z di dunia (galeri menghadap +x).
  const move = s + 1.3;
  tl.to(track, { x: -distance, duration: D, ease: "none" }, move);
  ctx.drift(move, { dz: -distance / ctx.S }, D);
  slots.forEach((slot) => tl.fromTo(slot, { rotate: 3, yPercent: 6 }, { rotate: -2, yPercent: -3, duration: D, ease: "none" }, move));

  // Keluar: semua memudar kecuali kartu terakhir (babak Reel tumbuh dari kartu itu).
  const out = move + D;
  const others = [ctx.el.querySelector(".projects-track > div:first-child"), ...slots.slice(0, -1)].filter(Boolean);
  tl.to(others, { opacity: 0, duration: 0.6 }, out);
  return 1.3 + D + 1;
};
