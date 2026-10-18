"use client";

import { requestUpload } from "@/app/admin/actions";

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 0.82;

/**
 * Perkecil foto di browser sebelum diunggah (maks. 2000px, WebP).
 * Foto HP 4–8 MB biasanya jadi 200–500 KB, jadi upload & muat halaman jauh lebih cepat.
 * SVG/GIF tidak diubah; jika hasil kompresi malah lebih besar, file asli dipakai.
 */
export async function compressImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

function putWithProgress(url: string, file: File, onProgress?: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type);
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload gagal (${xhr.status}).`)));
    xhr.onerror = () => reject(new Error("Koneksi terputus saat mengunggah. Coba lagi."));
    xhr.send(file);
  });
}

/** Kompres (khusus gambar) lalu unggah langsung ke Supabase Storage. Mengembalikan URL publik. */
export async function uploadDirect(file: File, kind: "image" | "audio", folder: string, onProgress?: (pct: number) => void) {
  const ready = kind === "image" ? await compressImage(file) : file;
  const ticket = await requestUpload({ kind, folder, name: ready.name, type: ready.type, size: ready.size });
  if (!ticket.ok) throw new Error(ticket.error);
  await putWithProgress(ticket.signedUrl, ready, onProgress);
  return { url: ticket.publicUrl, originalSize: file.size, size: ready.size };
}

export function formatBytes(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}
