"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Modal, ModalCloseButton } from "@/components/feedback/modal";
import type { Chapter, Experience, GalleryItem } from "@/lib/db/schema";
import { useSceneNear } from "../sceneStore";
import type { SceneBuild } from "../types";

/** Kartu depan statis selama Swiper (dimuat terpisah) belum siap. */
function GalleryPoster({ item }: { item?: GalleryItem }) {
  return (
    <div className="relative mx-auto aspect-[3/4] w-[min(18rem,46vw,32dvh)] overflow-hidden rounded-2xl bg-ink lg:w-[min(20rem,30dvh*1.2)]">
      {item ? <Image src={item.url} alt={item.caption || "Foto galeri"} fill sizes="320px" className="object-cover" /> : null}
    </div>
  );
}

const GalleryCards = dynamic(() => import("./GalleryCards"), { ssr: false });

const KIND_LABEL: Record<string, string> = {
  organisasi: "Organisasi",
  kepanitiaan: "Kepanitiaan",
  lomba: "Lomba",
  magang: "Magang",
  kerja: "Kerja",
};

export function ExperienceScene({ chapter, experiences, gallery }: { chapter?: Chapter; experiences: Experience[]; gallery: GalleryItem[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  // Swiper baru dimuat saat babak ini mendekat.
  const near = useSceneNear("experience", 1);
  const current = lightbox !== null ? gallery[lightbox] : null;
  const step = (d: number) => setLightbox((i) => (i === null ? i : (i + d + gallery.length) % gallery.length));

  return (
    <div className="flex h-full w-full items-center justify-center px-5 pb-20 pt-24 text-paper sm:px-6 sm:pt-28">
      <div className="grid w-full max-w-6xl items-center gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="min-w-0">
          <div className="xp-head">
            <h2 className="font-display text-[clamp(1.9rem,4.4vw,3.6rem)] font-extrabold leading-[0.95]">{chapter?.title ?? "Di luar kelas"}</h2>
            {chapter?.body ? <p className="mt-2 max-w-[52ch] text-base leading-relaxed text-paper/85 sm:mt-4 sm:text-lg">{chapter.body}</p> : null}
          </div>

          {/* Desktop: daftar utuh yang menyala satu per satu. HP: satu item bergantian di tempat yang sama. */}
          <ol className="xp-list relative mt-5 grid pl-10 sm:mt-6 lg:block">
            <span className="absolute left-[11px] top-2 bottom-2 hidden w-0.5 bg-paper/15 lg:block" aria-hidden />
            <span className="xp-line absolute left-[11px] top-2 bottom-2 hidden w-0.5 origin-top bg-[#ffb48a] lg:block" aria-hidden />
            {experiences.map((x) => (
              <li key={x.id} className="xp-item relative col-start-1 row-start-1 pb-0 lg:pb-5 lg:last:pb-0">
                <span className="xp-dot absolute -left-10 top-1.5 size-6 rounded-full border-4 border-[#2b2350] bg-[#ffb48a]" aria-hidden />
                <p className="tabular text-sm font-semibold text-[#ffb48a]">
                  {KIND_LABEL[x.kind] ?? x.kind} · {x.start === x.end ? x.start : `${x.start} – ${x.end}`}
                </p>
                <h3 className="mt-0.5 font-display text-xl font-bold leading-tight">{x.title}</h3>
                <p className="font-semibold text-paper/80">{x.place}</p>
                {x.description ? <p className="mt-1 line-clamp-2 max-w-[56ch] text-sm leading-relaxed text-paper/75">{x.description}</p> : null}
              </li>
            ))}
          </ol>
        </div>

        {gallery.length ? (
          <div className="xp-gallery">
            {near ? <GalleryCards gallery={gallery} onOpen={setLightbox} /> : <GalleryPoster item={gallery[0]} />}
            <p className="mt-4 text-center text-xs font-semibold text-paper/70 sm:text-sm">Geser kartunya, ketuk untuk memperbesar</p>
          </div>
        ) : null}
      </div>

      <Modal open={current !== null} onClose={() => setLightbox(null)} label="Foto galeri" size="lg">
        {current ? (
          <figure className="relative overflow-hidden rounded-3xl bg-ink shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]">
            <div className="relative h-[min(78dvh,52rem)] w-full">
              <Image src={current.url} alt={current.caption || "Foto galeri"} fill sizes="(min-width: 896px) 896px, 100vw" className="object-contain" />
            </div>
            <figcaption className="flex items-center justify-between gap-3 bg-[#fbf7f0] px-5 py-3 text-ink">
              <span className="font-display font-bold">{current.caption || "Galeri"}</span>
              <span className="tabular text-sm text-ink-soft">
                {(lightbox ?? 0) + 1} / {gallery.length}
              </span>
            </figcaption>
            <ModalCloseButton onClick={() => setLightbox(null)} className="absolute right-3 top-3" />
            {gallery.length > 1 ? (
              <>
                <button type="button" aria-label="Foto sebelumnya" onClick={() => step(-1)} className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-ink hover:bg-paper">
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                </button>
                <button type="button" aria-label="Foto berikutnya" onClick={() => step(1)} className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-ink hover:bg-paper">
                  <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
                </button>
              </>
            ) : null}
          </figure>
        ) : null}
      </Modal>
    </div>
  );
}

/** Pengalaman: senja; item timeline maju satu per satu, kartu galeri mengipas. */
export const buildExperience: SceneBuild = (tl, s, ctx) => {
  const items = Array.from(ctx.el.querySelectorAll<HTMLElement>(".xp-item"));
  const STEP = 0.9;
  // Daftar utuh hanya bila layarnya cukup lebar & tinggi; selain itu item tampil satu per satu.
  const desktop = !ctx.mobile && ctx.vw >= 1024 && ctx.vh >= 760;
  ctx.el.querySelector(".xp-list")?.classList.toggle("xp-stack", !desktop);

  tl.from(ctx.el.querySelector(".xp-head"), { y: 60, opacity: 0, duration: 0.8, ease: "power2.out" }, s)
    .from(ctx.el.querySelector(".xp-gallery"), { scale: 0.6, rotate: -8, opacity: 0, duration: 1, ease: "back.out(1.4)" }, s + 0.3);

  items.forEach((item, i) => {
    const t = s + 0.8 + i * STEP;
    if (desktop) {
      tl.fromTo(item, { opacity: 0.18, x: -12 }, { opacity: 1, x: 0, duration: 0.4 }, t).from(item.querySelector(".xp-dot"), { scale: 0, duration: 0.3, ease: "back.out(3)" }, t);
    } else {
      tl.fromTo(item, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35 }, t);
      if (i < items.length - 1) tl.to(item, { yPercent: -25, opacity: 0, duration: 0.3 }, t + STEP - 0.3);
    }
  });
  if (desktop) tl.fromTo(ctx.el.querySelector(".xp-line"), { scaleY: 0 }, { scaleY: 1, duration: items.length * STEP, ease: "none" }, s + 0.8);

  // Keluar: kamera mendongak ke langit malam → isi turun keluar layar.
  const out = s + 0.8 + items.length * STEP + 0.4;
  tl.to(ctx.el, { yPercent: 55, opacity: 0, duration: 1, ease: "power2.in" }, out).to(".cam-far", { yPercent: 120, duration: 1, ease: "power2.in" }, out);
  return out - s + 1;
};
