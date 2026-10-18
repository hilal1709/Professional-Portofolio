import { ArrowLeft01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AosInit } from "@/components/AosInit";
import { MascotSvg } from "@/components/mascot/MascotSvg";
import { ProjectCover } from "@/components/ProjectCover";
import { getProject, getProjectSlugs } from "@/lib/data";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    return await getProjectSlugs();
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  return project ? { title: project.title, description: project.summary } : { title: "Proyek tidak ditemukan" };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const paragraphs = project.content.split(/\n{2,}/).filter(Boolean);

  return (
    <main className="min-h-dvh bg-paper">
      <AosInit />
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-8">
        <Link href="/#proyek" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper-deep hover:text-ink">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          Kembali ke cerita
        </Link>

        <header className="mt-8">
          <p className="font-semibold text-sisfor">
            {project.role} · {project.year}
          </p>
          <h1 className="mt-2 font-display text-[clamp(2.6rem,7vw,5rem)] font-extrabold leading-[0.92] text-ink">{project.title}</h1>
          <p className="mt-5 max-w-[60ch] text-xl leading-relaxed text-ink-soft">{project.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <span key={t} className="rounded-full bg-paper-deep px-3 py-1 text-sm font-semibold text-ink">
                {t}
              </span>
            ))}
          </div>
        </header>

        <ProjectCover project={project} data-aos="fade-up" className="mt-10 aspect-[16/9] w-full rounded-3xl" sizes="(min-width: 896px) 896px, 100vw" />

        <article className="mt-12 grid gap-10 md:grid-cols-[1fr_10rem]">
          <div className="space-y-5 text-lg leading-relaxed text-ink">
            {paragraphs.map((p, i) => (
              <p key={i} data-aos="fade-up" className="max-w-[68ch] whitespace-pre-line">
                {p}
              </p>
            ))}
            <div className="flex flex-wrap gap-3 pt-4">
              {project.demoUrl ? (
                <a href={project.demoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-sisfor px-5 py-2.5 font-semibold text-paper hover:bg-sisfor-deep">
                  Lihat demo <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} />
                </a>
              ) : null}
              {project.repoUrl ? (
                <a href={project.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 font-semibold text-paper hover:bg-ink-soft">
                  Kode sumber <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} />
                </a>
              ) : null}
            </div>
          </div>
          <MascotSvg armR={-92} className="hidden w-40 md:block" title="Maskot menunjuk ke cerita proyek" />
        </article>

        {project.gallery.length ? (
          <section className="mt-16 grid gap-4 sm:grid-cols-2">
            {project.gallery.map((src) => (
              <div key={src} data-aos="zoom-in-up" className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper-deep">
                <Image src={src} alt={`Tangkapan layar ${project.title}`} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
