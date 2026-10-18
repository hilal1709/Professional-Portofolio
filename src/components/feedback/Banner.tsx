import { Alert02Icon, Cancel01Icon, InformationCircleIcon, SparklesIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "info" | "warning" | "success";

const TONE: Record<Tone, { box: string; chip: string; icon: IconSvgElement }> = {
  brand: { box: "bg-sisfor text-paper", chip: "bg-paper/15 text-paper", icon: SparklesIcon },
  info: { box: "bg-[#fbf7f0] text-ink ring-1 ring-[#e3d3b8]", chip: "bg-ink/8 text-ink", icon: InformationCircleIcon },
  warning: { box: "bg-[#fff4d6] text-[#5c4300] ring-1 ring-[#f0d68a]", chip: "bg-[#f0d68a]/60 text-[#5c4300]", icon: Alert02Icon },
  success: { box: "bg-leaf/12 text-[#2f4a24] ring-1 ring-leaf/30", chip: "bg-leaf/20 text-[#2f4a24]", icon: Tick02Icon },
};

/** Banner bertema: dipakai untuk pengumuman situs dan pemberitahuan di CMS. */
export function Banner({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <div role={tone === "warning" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-2xl px-4 py-3", t.box, className)}>
      <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", t.chip)}>
        <HugeiconsIcon icon={t.icon} size={16} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 text-sm leading-snug">
        {title ? <p className="font-display text-base font-bold leading-tight">{title}</p> : null}
        {children ? <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup pemberitahuan"
          className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full opacity-80 transition-opacity hover:opacity-100"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} />
        </button>
      ) : null}
    </div>
  );
}
