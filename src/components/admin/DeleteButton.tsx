"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTransition } from "react";
import { deleteEntity } from "@/app/admin/actions";
import { useConfirm } from "@/components/feedback/modal";
import { useToast } from "@/components/feedback/toast";

export function DeleteButton({ entity, id, label = "data ini" }: { entity: string; id: number; label?: string }) {
  const [pending, start] = useTransition();
  const confirm = useConfirm();
  const toast = useToast();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        const ok = await confirm({
          tone: "danger",
          title: `Hapus ${label}?`,
          description: "Data akan hilang dari beranda dan tidak bisa dikembalikan.",
          confirmLabel: "Ya, hapus",
        });
        if (!ok) return;
        start(async () => {
          await deleteEntity(entity, id);
          toast({ tone: "success", title: "Terhapus", description: "Beranda sudah diperbarui." });
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
    >
      <HugeiconsIcon icon={Delete02Icon} size={16} /> {pending ? "Menghapus..." : "Hapus"}
    </button>
  );
}
