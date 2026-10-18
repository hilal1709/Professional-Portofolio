"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, deleteSession, requireAdmin } from "@/lib/auth";
import { ENTITIES, isEntityKey, type Field } from "@/lib/cms/config";
import { TABLES } from "@/lib/cms/tables";
import { adminUsers, db, messages } from "@/lib/db";
import { createDirectUpload, type UploadKind } from "@/lib/storage";

export type FormState = { error?: string; ok?: boolean } | null;

function refreshSite() {
  revalidatePath("/", "layout");
}

/* ---------- Auth ---------- */

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Isi email dan password." };

  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) return { error: "Email atau password salah." };

  await createSession({ uid: user.id, email: user.email });
  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/admin/login");
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < 10) return { error: "Password baru minimal 10 karakter." };
  if (next !== confirm) return { error: "Konfirmasi password tidak sama." };

  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.uid)).limit(1);
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { error: "Password saat ini salah." };

  await db.update(adminUsers).set({ passwordHash: await bcrypt.hash(next, 12) }).where(eq(adminUsers.id, user.id));
  return { ok: true };
}

/* ---------- CRUD generik ---------- */

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function readField(field: Field, formData: FormData): unknown {
  const raw = formData.get(field.name);
  switch (field.type) {
    case "number": {
      const n = Number(raw);
      return Number.isFinite(n) ? Math.round(n) : 0;
    }
    case "boolean":
      return raw === "on";
    case "tags":
      return String(raw ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    case "socials":
      return String(raw ?? "")
        .split("\n")
        .map((line) => line.split("|").map((p) => p.trim()))
        .filter(([label, url]) => label && url)
        .map(([label, url]) => ({ label, url }));
    case "images":
      return formData.getAll(field.name).map(String).filter(Boolean);
    default:
      return String(raw ?? "").trim();
  }
}

export async function saveEntity(entityKey: string, id: number | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!isEntityKey(entityKey)) return { error: "Entitas tidak dikenal." };
  const config = ENTITIES[entityKey];
  const table = TABLES[entityKey];

  const values: Record<string, unknown> = {};
  try {
    for (const field of config.fields) {
      if (field.readOnly) continue;
      const value = readField(field, formData);
      if (field.required && (value === "" || (Array.isArray(value) && value.length === 0))) {
        return { error: `${field.label} wajib diisi.` };
      }
      values[field.name] = value;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal membaca form." };
  }

  if (entityKey === "projects") values.slug = slugify(String(values.slug || values.title));
  if (entityKey === "skills") values.level = Math.max(0, Math.min(100, Number(values.level)));
  if (entityKey === "profile") values.updatedAt = new Date();

  try {
    if (id) {
      await db.update(table).set(values).where(eq(table.id, id));
    } else {
      if (!config.canCreate && !config.singleton) return { error: "Data ini tidak bisa ditambah." };
      await db.insert(table).values(values);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/unique|duplicate/i.test(msg)) return { error: "Slug sudah dipakai proyek lain. Ganti judul atau slug." };
    return { error: "Gagal menyimpan ke database. Coba lagi." };
  }

  refreshSite();
  redirect(`/admin/${entityKey}?saved=1`);
}

export async function deleteEntity(entityKey: string, id: number) {
  await requireAdmin();
  if (!isEntityKey(entityKey) || !ENTITIES[entityKey].canDelete) return;
  const table = TABLES[entityKey];
  await db.delete(table).where(eq(table.id, id));
  refreshSite();
  revalidatePath(`/admin/${entityKey}`);
}

/* ---------- Upload langsung ke Supabase ---------- */

export type UploadTicket = { ok: true; signedUrl: string; publicUrl: string } | { ok: false; error: string };

export async function requestUpload(input: { kind: UploadKind; folder: string; name: string; type: string; size: number }): Promise<UploadTicket> {
  await requireAdmin();
  try {
    return { ok: true, ...(await createDirectUpload(input)) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyiapkan upload." };
  }
}

/* ---------- Pesan masuk ---------- */

export async function setMessageRead(id: number, read: boolean) {
  await requireAdmin();
  await db.update(messages).set({ read }).where(eq(messages.id, id));
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteMessage(id: number) {
  await requireAdmin();
  await db.delete(messages).where(eq(messages.id, id));
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}
