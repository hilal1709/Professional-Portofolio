"use client";

import { SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useActionState } from "react";
import { sendMessage, type ContactState } from "@/app/actions";
import { useToast } from "@/components/feedback/toast";
import { SocialIcon } from "@/components/icons";
import { LottiePlayer } from "@/components/LottiePlayer";
import { Mascot, SpeechBubble } from "@/components/mascot/Mascot";
import { FloatingDock } from "@/components/ui/floating-dock";
import type { Chapter, Profile } from "@/lib/db/schema";
import sentAnim from "@/lottie/sent.json";
import type { SceneBuild } from "../types";

const field =
  "w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-paper placeholder:text-paper/45 outline-none transition-colors focus:border-[#ffb48a] focus:bg-white/[0.1] sm:py-3";

export function ContactScene({ chapter, profile }: { chapter?: Chapter; profile: Profile | null }) {
  const toast = useToast();
  const [state, action, pending] = useActionState<ContactState, FormData>(async (prev, fd) => {
    const result = await sendMessage(prev, fd);
    if (result?.ok) toast({ tone: "success", title: "Pesan terkirim", description: "Terima kasih! Balasan akan dikirim ke emailmu." });
    else if (result?.error) toast({ tone: "error", title: "Pesan belum terkirim", description: result.error });
    return result;
  }, null);

  const dockItems = [
    ...(profile?.email ? [{ title: "Email", icon: <SocialIcon label="email" className="size-full text-ink" />, href: `mailto:${profile.email}` }] : []),
    ...(profile?.socials ?? []).map((s) => ({ title: s.label, icon: <SocialIcon label={s.label} className="size-full text-ink" />, href: s.url })),
  ];

  return (
    <div className="flex h-full w-full flex-col px-5 pt-24 text-paper sm:px-6 sm:pt-28">
      <div className="mx-auto grid w-full max-w-6xl flex-1 content-center items-center gap-5 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div className="contact-head">
          <h2 className="font-display text-[clamp(2rem,5vw,4.2rem)] font-extrabold leading-[0.92]">{chapter?.title ?? "Mari berkolaborasi"}</h2>
          {chapter?.body ? <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-paper/85 sm:mt-4 sm:text-lg">{chapter.body}</p> : null}
          {profile?.email ? (
            <a href={`mailto:${profile.email}`} className="mt-3 inline-block font-display text-lg font-semibold text-[#ffb48a] underline decoration-2 hover:text-paper sm:mt-5 sm:text-xl">
              {profile.email}
            </a>
          ) : null}
          <div className="contact-mascot mt-5 hidden items-end gap-1 lg:flex">
            <Mascot scene="contact" pose="wave" className="aspect-[2/3] h-36" />
            {chapter?.mascotLine ? <SpeechBubble className="mb-24">{chapter.mascotLine}</SpeechBubble> : null}
          </div>
        </div>

        <div className="contact-form rounded-3xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur-md sm:p-8">
          {state?.ok ? (
            <div className="flex flex-col items-center py-8 text-center" role="status">
              <div className="size-24">
                <LottiePlayer src={sentAnim} autoplay loop={false} className="h-full w-full" />
              </div>
              <h3 className="mt-4 font-display text-3xl font-bold">Pesan terkirim!</h3>
              <p className="mt-2 max-w-[36ch] text-paper/80">Terima kasih sudah menyapa. Aku akan membalas lewat email secepatnya.</p>
            </div>
          ) : (
            <form action={action} className="grid gap-3 sm:gap-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <label className="grid gap-1 text-sm font-semibold">
                  Nama
                  <input name="name" required minLength={2} autoComplete="name" className={field} placeholder="Nama kamu" />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Email
                  <input name="email" type="email" required autoComplete="email" className={field} placeholder="nama@email.com" />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-semibold">
                Pesan
                <textarea name="body" required minLength={10} rows={4} className={field} placeholder="Ceritakan ide atau tawaranmu..." />
              </label>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              {state?.error ? (
                <p className="rounded-lg bg-[#b42318]/25 px-3 py-2 text-sm font-semibold text-[#ffd2cc]" role="alert">
                  {state.error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sisfor px-6 py-3 font-semibold text-paper transition-[background-color,transform] hover:bg-[#c0242b] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? "Mengirim..." : "Kirim pesan"}
                <HugeiconsIcon icon={SentIcon} size={18} />
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="contact-foot pb-16 sm:pb-20">
        {dockItems.length ? (
          <div className="mt-4 flex justify-center">
            <FloatingDock items={dockItems} desktopClassName="bg-paper/90" mobileClassName="" />
          </div>
        ) : null}
        <footer className="mx-auto mt-4 flex max-w-6xl flex-col items-center justify-between gap-1 border-t border-white/10 pt-3 text-xs text-paper/60 sm:flex-row sm:text-sm">
          <span>
            © {new Date().getFullYear()} {profile?.name ?? "M. Hilal"} · {profile?.major} {profile?.campus ? "UISI" : ""}
          </span>
          <span>Dibuat dengan Next.js, GSAP & Remotion</span>
        </footer>
      </div>
    </div>
  );
}

/** Kontak: kamera mendongak ke langit malam; form muncul, footer jadi frame penutup. */
export const buildContact: SceneBuild = (tl, s, ctx) => {
  tl.fromTo(ctx.el, { yPercent: -45, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, ease: "power2.out" }, s)
    .from(ctx.el.querySelector(".contact-head"), { y: 50, opacity: 0, duration: 0.7 }, s + 0.7)
    .from(ctx.el.querySelector(".contact-form"), { y: 60, scale: 0.96, opacity: 0, duration: 0.8, ease: "power2.out" }, s + 1)
    .from(ctx.el.querySelector(".contact-foot"), { y: 30, opacity: 0, duration: 0.6 }, s + 1.8);
  const mascot = ctx.el.querySelector(".contact-mascot");
  if (mascot) tl.from(mascot, { xPercent: -60, opacity: 0, duration: 0.7, ease: "back.out(1.4)" }, s + 1.2);
  return 3.2;
};
