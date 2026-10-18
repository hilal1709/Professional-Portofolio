"use client";

import {
  Award01Icon,
  Briefcase01Icon,
  DashboardSquare01Icon,
  Folder01Icon,
  Image01Icon,
  Logout01Icon,
  Message01Icon,
  Route01Icon,
  Settings01Icon,
  UserIcon,
  BookOpen01Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: IconSvgElement }[] = [
  { href: "/admin", label: "Ringkasan", icon: DashboardSquare01Icon },
  { href: "/admin/messages", label: "Pesan masuk", icon: Message01Icon },
  { href: "/admin/profile", label: "Profil", icon: UserIcon },
  { href: "/admin/chapters", label: "Babak cerita", icon: BookOpen01Icon },
  { href: "/admin/milestones", label: "Perjalanan", icon: Route01Icon },
  { href: "/admin/skills", label: "Skill", icon: Award01Icon },
  { href: "/admin/projects", label: "Proyek", icon: Folder01Icon },
  { href: "/admin/experiences", label: "Pengalaman", icon: Briefcase01Icon },
  { href: "/admin/gallery", label: "Galeri", icon: Image01Icon },
  { href: "/admin/account", label: "Akun", icon: Settings01Icon },
];

export function Sidebar({ email, unread }: { email: string; unread: number }) {
  const pathname = usePathname();
  return (
    <aside className="flex flex-col gap-6 border-b border-border bg-card px-4 py-5 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:border-b-0 lg:border-r">
      <Link href="/admin" className="px-2 font-display text-2xl font-extrabold text-ink">
        Hilal<span className="text-sisfor">.</span> <span className="text-base font-semibold text-ink-soft">CMS</span>
      </Link>
      <nav aria-label="Menu CMS" className="-mx-1 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                active ? "bg-sisfor text-paper" : "text-ink-soft hover:bg-paper-deep hover:text-ink",
              )}
            >
              <HugeiconsIcon icon={item.icon} size={18} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/admin/messages" && unread > 0 ? (
                <span className={cn("tabular rounded-full px-2 text-xs", active ? "bg-paper text-sisfor" : "bg-sisfor text-paper")}>{unread}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden gap-1 border-t border-border pt-4 lg:grid">
        <a href="/" target="_blank" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper-deep hover:text-ink">
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} /> Lihat situs
        </a>
        <p className="truncate px-3 text-xs text-ink-soft" title={email}>
          {email}
        </p>
        <form action={logout}>
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper-deep hover:text-destructive">
            <HugeiconsIcon icon={Logout01Icon} size={18} /> Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
