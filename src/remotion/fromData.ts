import type { Chapter, Milestone, Profile, Project, Skill } from "../lib/db/schema";
import { showreelDefaults, type ShowreelProps } from "./props";

type Source = {
  profile: Profile | null;
  chapters: Record<string, Chapter | undefined>;
  milestones: Milestone[];
  skills: Skill[];
  projects: Project[];
};

/** Ubah data CMS menjadi props Showreel. Dipakai Player di situs dan skrip `remotion:props`. */
export function toShowreelProps(d: Source): ShowreelProps {
  const p = d.profile;
  return {
    name: p?.name || showreelDefaults.name,
    tagline: p?.tagline ?? "",
    campus: p?.campus || showreelDefaults.campus,
    major: p?.major ?? "",
    batch: p?.batch ?? "",
    outro: d.chapters.contact?.title || showreelDefaults.outro,
    milestones: d.milestones.map((m) => ({ year: m.year, title: m.title })),
    // "Analisis Proses Bisnis (BPMN)" → "Analisis Proses Bisnis" supaya chip tetap ringkas.
    skills: d.skills.map((s) => s.name.split(" (")[0]),
    projects: d.projects.map((pr) => ({ title: pr.title, color: pr.color })),
    music: p && !p.showreelMusicOn ? null : (p?.showreelMusic ?? ""),
  };
}
