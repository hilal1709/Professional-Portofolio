"use server";

import { z } from "zod";
import { db, messages } from "@/lib/db";

export type ContactState = { ok: boolean; error?: string } | null;

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 huruf.").max(80),
  email: z.email("Format email belum benar."),
  body: z.string().trim().min(10, "Pesan minimal 10 karakter.").max(3000, "Pesan terlalu panjang (maks. 3000 karakter)."),
});

export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: bot biasanya mengisi semua field.
  if (formData.get("website")) return { ok: true };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  try {
    await db.insert(messages).values(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "Pesan gagal terkirim karena gangguan server. Coba lagi sebentar lagi." };
  }
}
