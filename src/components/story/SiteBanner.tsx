"use client";

import { useSyncExternalStore } from "react";
import { Banner } from "@/components/feedback/Banner";

type Props = { text: string; cta: string; url: string };

const EVENT = "site-banner-dismiss";

function keyFor(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return `banner-dismissed:${h}`;
}

function readDismissed(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** Banner pengumuman dari CMS. Ditutup = tidak muncul lagi sampai teksnya diganti. */
export function SiteBanner({ text, cta, url }: Props) {
  const key = keyFor(text);
  const dismissed = useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => readDismissed(key),
    () => false,
  );
  if (dismissed) return null;

  const external = /^https?:\/\//.test(url);
  return (
    <Banner
      tone="brand"
      className="toast-in mx-auto w-full max-w-6xl py-2 shadow-[0_12px_30px_-16px_rgba(122,17,22,0.7)]"
      action={
        cta && url ? (
          <a
            href={url}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            className="whitespace-nowrap rounded-full bg-paper px-3.5 py-1.5 text-sm font-semibold text-sisfor transition-colors hover:bg-white"
          >
            {cta}
          </a>
        ) : null
      }
      onDismiss={() => {
        try {
          window.localStorage.setItem(key, "1");
        } catch {
          /* mode privat: cukup sembunyikan untuk sesi ini */
        }
        window.dispatchEvent(new Event(EVENT));
      }}
    >
      <span className="font-semibold">{text}</span>
    </Banner>
  );
}
