import "server-only";
import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_BUCKET || "projek";

const KINDS = {
  image: {
    types: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"],
    maxBytes: 5 * 1024 * 1024,
    hint: "Pakai JPG, PNG, WebP, GIF, AVIF, atau SVG.",
  },
  audio: {
    types: ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/wav", "audio/x-wav", "audio/webm"],
    maxBytes: 10 * 1024 * 1024,
    hint: "Pakai MP3, M4A, AAC, OGG, atau WAV.",
  },
} as const;

export type UploadKind = keyof typeof KINDS;

export function storageReady() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

/**
 * Siapkan URL upload bertanda tangan supaya browser mengunggah langsung ke Supabase
 * (lebih cepat, tidak lewat server Next, tidak terbatas body size Server Action).
 * Kunci service_role tetap di server; browser hanya menerima URL sekali pakai.
 */
export async function createDirectUpload(input: { kind: UploadKind; folder: string; name: string; type: string; size: number }) {
  const rule = KINDS[input.kind];
  if (!rule) throw new Error("Jenis file tidak dikenal.");
  if (!storageReady()) throw new Error("Upload belum aktif: isi SUPABASE_SERVICE_ROLE_KEY di .env.local.");
  if (!(rule.types as readonly string[]).includes(input.type)) throw new Error(`Format ${input.type || "file"} tidak didukung. ${rule.hint}`);
  if (input.size > rule.maxBytes) throw new Error(`Ukuran file maksimal ${rule.maxBytes / 1024 / 1024} MB.`);

  const folder = input.folder.replace(/[^a-z0-9-]/gi, "") || "misc";
  const ext = input.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || (input.kind === "audio" ? "mp3" : "jpg");
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const bucket = client().storage.from(BUCKET);
  const { data, error } = await bucket.createSignedUploadUrl(path);
  if (error || !data) throw new Error(`Gagal menyiapkan upload: ${error?.message ?? "tanpa respons"}`);
  return { signedUrl: data.signedUrl, publicUrl: bucket.getPublicUrl(path).data.publicUrl };
}
