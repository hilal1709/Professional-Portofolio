"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/admin/actions";
import { inputClass } from "./styles";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, null);
  return (
    <form action={action} className="mt-6 grid gap-4 rounded-2xl bg-card p-6 shadow-[0_20px_50px_-30px_rgba(34,28,24,0.5)] ring-1 ring-border">
      <label className="grid gap-1.5 text-sm font-semibold text-ink">
        Email
        <input name="email" type="email" required autoComplete="username" className={inputClass} />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-ink">
        Password
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </label>
      {state?.error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      ) : null}
      <button
        disabled={pending}
        className="rounded-full bg-sisfor px-5 py-3 font-semibold text-paper transition-colors hover:bg-sisfor-deep disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}
