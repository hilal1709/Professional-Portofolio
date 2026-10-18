import "server-only";
import { asc, eq } from "drizzle-orm";
import {
  chapters,
  db,
  experiences,
  gallery,
  milestones,
  profile,
  projects,
  skills,
  type Chapter,
} from "@/lib/db";

export async function getHomeData() {
  // Berurutan, bukan Promise.all: query paralel/pipelined macet lewat transaction pooler Supabase.
  const prof = await db.select().from(profile).limit(1);
  const chs = await db.select().from(chapters).orderBy(asc(chapters.sortOrder));
  const ms = await db.select().from(milestones).orderBy(asc(milestones.sortOrder));
  const sk = await db.select().from(skills).orderBy(asc(skills.sortOrder));
  const pr = await db.select().from(projects).orderBy(asc(projects.sortOrder));
  const ex = await db.select().from(experiences).orderBy(asc(experiences.sortOrder));
  const gl = await db.select().from(gallery).orderBy(asc(gallery.sortOrder));

  const chapterMap = Object.fromEntries(chs.map((c) => [c.key, c])) as Record<string, Chapter | undefined>;

  return {
    profile: prof[0] ?? null,
    chapters: chapterMap,
    milestones: ms,
    skills: sk,
    projects: pr,
    experiences: ex,
    gallery: gl,
  };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;

export async function getProject(slug: string) {
  const rows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getProjectSlugs() {
  return db.select({ slug: projects.slug }).from(projects);
}
