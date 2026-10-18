"use client";

import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

/** AOS untuk halaman dengan scroll biasa (halaman detail proyek). Beranda memakai panggung GSAP. */
export function AosInit() {
  useEffect(() => {
    AOS.init({ once: true, duration: 700, easing: "ease-out-cubic", offset: 40, disable: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches });
  }, []);
  return null;
}
