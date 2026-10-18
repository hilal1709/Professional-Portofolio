"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { MascotSvg } from "@/components/mascot/MascotSvg";
import { cn } from "@/lib/utils";

/**
 * Modal berbasis <dialog> native: fokus terkunci, Esc menutup, backdrop bisa diklik.
 */
export function Modal({
  open,
  onClose,
  children,
  label,
  size = "sm",
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "modal-panel m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-visible bg-transparent p-0 text-ink backdrop:bg-[#1b1512]/55 backdrop:backdrop-blur-[3px]",
        size === "sm" ? "max-w-md" : "max-w-4xl",
        className,
      )}
    >
      {open ? children : null}
    </dialog>
  );
}

export function ModalCloseButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Tutup"
      className={cn("grid size-9 place-items-center rounded-full bg-paper/90 text-ink shadow-sm transition-colors hover:bg-paper-deep", className)}
    >
      <HugeiconsIcon icon={Cancel01Icon} size={16} />
    </button>
  );
}

/* ---------- Konfirmasi (pengganti window.confirm) ---------- */

type ConfirmOptions = { title: string; description?: string; confirmLabel?: string; cancelLabel?: string; tone?: "danger" | "default" };
type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm harus dipakai di dalam <FeedbackProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })), []);
  const settle = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };
  const danger = pending?.tone === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!pending} onClose={() => settle(false)} label={pending?.title ?? "Konfirmasi"}>
        {pending ? (
          <div className="relative mt-14 rounded-3xl bg-[#fbf7f0] px-6 pb-6 pt-16 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] ring-1 ring-[#e3d3b8]">
            <MascotSvg
              armR={danger ? -40 : -140}
              armL={danger ? 40 : 6}
              mouth={danger ? "open" : "smile"}
              className="absolute -top-16 left-1/2 h-32 w-auto -translate-x-1/2"
              title=""
            />
            <h2 className="text-center font-display text-2xl font-bold leading-tight">{pending.title}</h2>
            {pending.description ? <p className="mx-auto mt-2 max-w-[34ch] text-center text-ink-soft">{pending.description}</p> : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => settle(false)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
              >
                {pending.cancelLabel ?? "Batal"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => settle(true)}
                className={cn(
                  "rounded-full px-5 py-2.5 text-sm font-semibold text-paper transition-colors",
                  danger ? "bg-destructive hover:bg-[#8f1c13]" : "bg-sisfor hover:bg-sisfor-deep",
                )}
              >
                {pending.confirmLabel ?? "Lanjutkan"}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </ConfirmContext.Provider>
  );
}
