"use client";

import { Alert02Icon, Cancel01Icon, InformationCircleIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";
export type ToastInput = { title: string; description?: string; tone?: ToastTone; duration?: number };
type ToastItem = Required<Omit<ToastInput, "description">> & { id: number; description?: string };

const TONE: Record<ToastTone, { icon: IconSvgElement; chip: string; bar: string }> = {
  success: { icon: Tick02Icon, chip: "bg-leaf/15 text-[#3d6630]", bar: "bg-leaf" },
  error: { icon: Alert02Icon, chip: "bg-sisfor/12 text-sisfor", bar: "bg-sisfor" },
  info: { icon: InformationCircleIcon, chip: "bg-ink/8 text-ink", bar: "bg-ink" },
};

const ToastContext = createContext<((t: ToastInput) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <FeedbackProvider>");
  return ctx;
}

function Toast({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(item.duration);
  const startedAt = useRef(0);

  const close = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => onClose(item.id), 220);
  }, [item.id, onClose]);

  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const timer = window.setTimeout(close, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, close]);

  const tone = TONE[item.tone];
  return (
    <li
      role={item.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "pointer-events-auto relative flex w-full gap-3 overflow-hidden rounded-2xl bg-[#fbf7f0] p-4 pr-11 text-ink shadow-[0_18px_44px_-18px_rgba(34,28,24,0.6)] ring-1 ring-[#e3d3b8]",
        leaving ? "toast-out" : "toast-in",
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", tone.chip)}>
        <HugeiconsIcon icon={tone.icon} size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="font-display text-base font-bold leading-tight">{item.title}</p>
        {item.description ? <p className="mt-1 text-sm leading-snug text-ink-soft">{item.description}</p> : null}
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Tutup notifikasi"
        className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={14} />
      </button>
      <span
        aria-hidden
        className={cn("toast-timer absolute inset-x-0 bottom-0 h-[3px] origin-left", tone.bar)}
        style={{ animationDuration: `${item.duration}ms`, animationPlayState: paused ? "paused" : "running" }}
      />
    </li>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((t: ToastInput) => {
    const item: ToastItem = { id: ++seq.current, title: t.title, description: t.description, tone: t.tone ?? "info", duration: t.duration ?? 4500 };
    setItems((prev) => [...prev.slice(-3), item]);
  }, []);
  const remove = useCallback((id: number) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ol
        aria-label="Notifikasi"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[24rem]"
      >
        {items.map((item) => (
          <Toast key={item.id} item={item} onClose={remove} />
        ))}
      </ol>
    </ToastContext.Provider>
  );
}
