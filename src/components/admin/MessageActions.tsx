"use client";

import { useTransition } from "react";
import { deleteMessage, setMessageRead } from "@/app/admin/actions";
import { useConfirm } from "@/components/feedback/modal";
import { useToast } from "@/components/feedback/toast";
import { buttonGhost } from "./styles";

export function MessageActions({ id, read, from }: { id: number; read: boolean; from: string }) {
  const [pending, start] = useTransition();
  const confirm = useConfirm();
  const toast = useToast();
  return (
    <div className="mt-4 flex flex-wrap gap-1 border-t border-border pt-3">
      <button type="button" disabled={pending} className={buttonGhost} onClick={() => start(() => setMessageRead(id, !read))}>
        {read ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
      </button>
      <button
        type="button"
        disabled={pending}
        className={`${buttonGhost} hover:bg-destructive/10 hover:text-destructive`}
        onClick={async () => {
          const ok = await confirm({
            tone: "danger",
            title: "Hapus pesan ini?",
            description: `Pesan dari ${from} akan dihapus permanen.`,
            confirmLabel: "Ya, hapus",
          });
          if (!ok) return;
          start(async () => {
            await deleteMessage(id);
            toast({ tone: "success", title: "Pesan dihapus" });
          });
        }}
      >
        Hapus
      </button>
    </div>
  );
}
