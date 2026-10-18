"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/feedback/toast";

/** Tampilkan toast "Tersimpan" setelah redirect ?saved=1, lalu bersihkan URL-nya. */
export function SavedNotice() {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    toast({ tone: "success", title: "Tersimpan", description: "Beranda sudah diperbarui." });
    router.replace(pathname, { scroll: false });
  }, [toast, router, pathname]);

  return null;
}
