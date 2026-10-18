import Image from "next/image";
import type { Project } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

/** Sampul proyek: pakai gambar dari CMS bila ada, jika tidak buat sampul tipografis dari warna proyek. */
export function ProjectCover({ project, className, sizes = "(min-width: 768px) 40vw, 90vw", ...rest }: { project: Project; className?: string; sizes?: string; "data-aos"?: string }) {
  if (project.cover) {
    return (
      <div {...rest} className={cn("relative overflow-hidden", className)}>
        <Image src={project.cover} alt={`Sampul ${project.title}`} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }
  const seed = project.slug.length;
  return (
    <div {...rest} className={cn("relative overflow-hidden", className)} style={{ background: project.color }} aria-hidden>
      <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <circle cx={300 + (seed % 5) * 10} cy={60} r={110} fill="#fff" opacity="0.1" />
        <rect x={-40} y={150 - (seed % 4) * 10} width={260} height={160} rx={30} fill="#000" opacity="0.12" transform="rotate(-12 0 200)" />
        <circle cx={70} cy={70} r={22} fill="#fff" opacity="0.18" />
      </svg>
      <div className="absolute inset-0 flex items-end justify-between p-6">
        <span className="font-display text-7xl font-extrabold leading-none text-white/90">
          {project.title
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")}
        </span>
        <span className="tabular font-display text-lg font-semibold text-white/75">{project.year}</span>
      </div>
    </div>
  );
}
