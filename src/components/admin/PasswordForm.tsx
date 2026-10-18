"use client";

import { useActionState } from "react";
import { changePassword, type FormState } from "@/app/admin/actions";
import { useToast } from "@/components/feedback/toast";
import { buttonPrimary, inputClass } from "./styles";

export function PasswordForm() {
  const toast = useToast();
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await changePassword(prev, fd);
    if (result?.ok) toast({ tone: "success", title: "Password diganti", description: "Pakai password baru saat login berikutnya." });
    return result;
  }, null);
  return (
    <form action={action} className="mt-8 grid gap-4 rounded-2xl bg-card p-6 ring-1 ring-border">
      {[
        ["current", "Password saat ini", "current-password"],
        ["next", "Password baru", "new-password"],
        ["confirm", "Ulangi password baru", "new-password"],
      ].map(([name, label, ac]) => (
        <label key={name} className="grid gap-1.5 text-sm font-semibold text-ink">
          {label}
          <input name={name} type="password" required autoComplete={ac} className={inputClass} />
        </label>
      ))}
      {state?.error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="rounded-lg bg-leaf/12 px-3 py-2 text-sm font-semibold text-[#2f4a24]">
          Password berhasil diganti.
        </p>
      ) : null}
      <div>
        <button disabled={pending} className={buttonPrimary}>
          {pending ? "Menyimpan..." : "Ganti password"}
        </button>
      </div>
    </form>
  );
}
