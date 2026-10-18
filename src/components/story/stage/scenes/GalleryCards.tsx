"use client";

import Image from "next/image";
import { EffectCards, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-cards";
import type { GalleryItem } from "@/lib/db/schema";

/** Tumpukan kartu foto. Dimuat terpisah (dynamic import) supaya Swiper tidak ikut di bundle awal. */
export default function GalleryCards({ gallery, onOpen }: { gallery: GalleryItem[]; onOpen: (i: number) => void }) {
  return (
    <Swiper
      modules={[EffectCards, Keyboard]}
      effect="cards"
      grabCursor
      keyboard={{ enabled: true }}
      className="!w-[min(18rem,46vw,32dvh)] lg:!w-[min(20rem,30dvh*1.2)]"
      aria-label="Galeri foto"
    >
      {gallery.map((g, i) => (
        <SwiperSlide key={g.id} className="overflow-hidden rounded-2xl bg-ink">
          <figure className="relative aspect-[3/4] cursor-zoom-in" onClick={() => onOpen(i)}>
            <Image src={g.url} alt={g.caption || "Foto galeri"} fill sizes="320px" className="object-cover" />
            {g.caption ? (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-sm font-semibold text-white sm:p-4">
                {g.caption}
              </figcaption>
            ) : null}
          </figure>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
