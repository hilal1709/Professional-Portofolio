"use client";

import type { AnimationItem } from "lottie-web";
import { useEffect, useRef } from "react";

type Props = {
  src: object;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Pemutar Lottie ringan: memakai build `lottie_light` (±46 KB gzip, vs ±190 KB versi penuh),
 * dimuat dinamis setelah halaman tampil. Menghormati prefers-reduced-motion.
 */
export function LottiePlayer({ src, loop = true, autoplay = true, className, "aria-label": label }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anim: AnimationItem | undefined;
    let cancelled = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (cancelled || !ref.current) return;
      anim = lottie.loadAnimation({
        container: ref.current,
        renderer: "svg",
        loop: reduce ? false : loop,
        autoplay: reduce ? false : autoplay,
        animationData: src,
      });
      if (reduce) anim.goToAndStop(0, true);
    });
    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, [src, loop, autoplay]);

  return <div ref={ref} className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}
