"use client";

import { Cancel01Icon, Upload04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useActionState, useCallback, useState } from "react";
import { saveEntity, type FormState } from "@/app/admin/actions";
import { useToast } from "@/components/feedback/toast";
import { Icon, ICON_NAMES } from "@/components/icons";
import { ENTITIES, type EntityKey, type Field } from "@/lib/cms/config";
import { formatBytes, uploadDirect } from "@/lib/upload-client";
import { cn } from "@/lib/utils";
import { buttonGhost, buttonPrimary, inputClass } from "./styles";

type Values = Record<string, unknown>;
type UploadCtx = { enabled: boolean; folder: string; setBusy: (delta: number) => void };

const DEFAULT_MUSIC = "/audio/showreel-default.mp3";

/** Unggah satu file dengan progress + toast; mengembalikan URL publik atau null jika gagal. */
function useUpload(ctx: UploadCtx, kind: "image" | "audio") {
  const toast = useToast();
  const [progress, setProgress] = useState<number | null>(null);
  const run = useCallback(
    async (file: File) => {
      ctx.setBusy(1);
      setProgress(0);
      try {
        const res = await uploadDirect(file, kind, ctx.folder, setProgress);
        const saved = res.originalSize - res.size;
        toast({
          tone: "success",
          title: kind === "audio" ? "Lagu terunggah" : "Gambar terunggah",
          description:
            saved > 20 * 1024
              ? `Dikompres ${formatBytes(res.originalSize)} → ${formatBytes(res.size)}. Jangan lupa klik Simpan.`
              : "Jangan lupa klik Simpan.",
        });
        return res.url;
      } catch (e) {
        toast({ tone: "error", title: "Upload gagal", description: e instanceof Error ? e.message : "Coba lagi." });
        return null;
      } finally {
        setProgress(null);
        ctx.setBusy(-1);
      }
    },
    [ctx, kind, toast],
  );
  return { progress, run };
}

function ProgressBar({ value }: { value: number | null }) {
  if (value === null) return null;
  return (
    <div className="grid gap-1" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label="Progres upload">
      <div className="h-1.5 overflow-hidden rounded-full bg-paper-deep">
        <div className="h-full rounded-full bg-sisfor transition-[width] duration-200" style={{ width: `${value}%` }} />
      </div>
      <span className="tabular text-xs font-semibold text-ink-soft">Mengunggah… {value}%</span>
    </div>
  );
}

function FilePicker({ accept, multiple, disabled, onFiles, label }: { accept: string; multiple?: boolean; disabled: boolean; onFiles: (files: File[]) => void; label: string }) {
  return (
    <label
      className={cn(
        "inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-sisfor",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <HugeiconsIcon icon={Upload04Icon} size={16} />
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </label>
  );
}

function ImageField({ field, value, ctx }: { field: Field; value: string; ctx: UploadCtx }) {
  const [url, setUrl] = useState(value);
  const { progress, run } = useUpload(ctx, "image");
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="relative size-28 shrink-0 overflow-hidden rounded-lg bg-paper-deep ring-1 ring-border">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau kecil di CMS
          <img src={url} alt="Pratinjau" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center px-2 text-center text-xs text-ink-soft">Belum ada gambar</span>
        )}
      </div>
      <div className="grid flex-1 gap-2">
        <input name={field.name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… atau /images/…" className={inputClass} />
        <FilePicker
          accept="image/*"
          disabled={!ctx.enabled || progress !== null}
          label={url ? "Ganti gambar" : "Unggah gambar"}
          onFiles={async ([file]) => {
            const next = await run(file);
            if (next) setUrl(next);
          }}
        />
        <ProgressBar value={progress} />
        <p className="text-xs text-ink-soft">
          {ctx.enabled ? "Foto otomatis dikecilkan (maks. 2000px, WebP) sebelum diunggah." : "Upload nonaktif sampai SUPABASE_SERVICE_ROLE_KEY diisi. Tempel URL gambar dulu."}
        </p>
      </div>
    </div>
  );
}

function ImagesField({ field, value, ctx }: { field: Field; value: string[]; ctx: UploadCtx }) {
  const [items, setItems] = useState(value);
  const [draft, setDraft] = useState("");
  const { progress, run } = useUpload(ctx, "image");
  return (
    <div className="grid gap-3">
      {items.length ? (
        <ul className="flex flex-wrap gap-3">
          {items.map((src) => (
            <li key={src} className="relative size-24 overflow-hidden rounded-lg bg-paper-deep ring-1 ring-border">
              <input type="hidden" name={field.name} value={src} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
              <button
                type="button"
                aria-label="Hapus gambar"
                onClick={() => setItems((all) => all.filter((i) => i !== src))}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-ink/80 text-paper hover:bg-destructive"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Tambah via URL gambar" className={cn(inputClass, "min-w-0 flex-1")} />
        <button
          type="button"
          className={buttonGhost}
          onClick={() => {
            const v = draft.trim();
            if (v) setItems((all) => (all.includes(v) ? all : [...all, v]));
            setDraft("");
          }}
        >
          Tambah
        </button>
      </div>
      <FilePicker
        accept="image/*"
        multiple
        disabled={!ctx.enabled || progress !== null}
        label="Unggah beberapa gambar"
        onFiles={async (files) => {
          for (const file of files) {
            const next = await run(file);
            if (next) setItems((all) => [...all, next]);
          }
        }}
      />
      <ProgressBar value={progress} />
    </div>
  );
}

function AudioField({ field, value, ctx }: { field: Field; value: string; ctx: UploadCtx }) {
  const [url, setUrl] = useState(value);
  const { progress, run } = useUpload(ctx, "audio");
  return (
    <div className="grid gap-2">
      <audio controls src={url || DEFAULT_MUSIC} preload="none" className="w-full max-w-md">
        Browser tidak bisa memutar pratinjau.
      </audio>
      <p className="text-xs font-semibold text-ink-soft">{url ? "Lagu pilihanmu" : "Sedang memakai lagu bawaan"}</p>
      <div className="flex flex-wrap gap-2">
        <input
          name={field.name}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Kosong = lagu bawaan, atau https://…/lagu.mp3"
          className={cn(inputClass, "min-w-0 flex-1")}
        />
        {url ? (
          <button type="button" className={buttonGhost} onClick={() => setUrl("")}>
            Pakai lagu bawaan
          </button>
        ) : null}
      </div>
      <FilePicker
        accept="audio/*"
        disabled={!ctx.enabled || progress !== null}
        label="Unggah lagu"
        onFiles={async ([file]) => {
          const next = await run(file);
          if (next) setUrl(next);
        }}
      />
      <ProgressBar value={progress} />
    </div>
  );
}

function IconField({ field, value }: { field: Field; value: string }) {
  const [current, setCurrent] = useState(value || "flag");
  return (
    <div role="radiogroup" aria-label={field.label} className="flex flex-wrap gap-2">
      {ICON_NAMES.map((name) => (
        <label
          key={name}
          title={name}
          className={cn(
            "grid size-11 cursor-pointer place-items-center rounded-lg ring-1 transition-colors",
            current === name ? "bg-sisfor text-paper ring-sisfor" : "bg-white text-ink-soft ring-border hover:text-ink",
          )}
        >
          <input type="radio" name={field.name} value={name} checked={current === name} onChange={() => setCurrent(name)} className="sr-only" />
          <Icon name={name} size={20} />
        </label>
      ))}
    </div>
  );
}

function FieldInput({ field, value, ctx }: { field: Field; value: unknown; ctx: UploadCtx }) {
  const common = { name: field.name, required: field.required, placeholder: field.placeholder, readOnly: field.readOnly };
  switch (field.type) {
    case "textarea":
      return <textarea {...common} defaultValue={String(value ?? "")} rows={field.name === "content" ? 9 : 4} className={inputClass} />;
    case "number":
      return <input {...common} type="number" inputMode="numeric" defaultValue={Number(value ?? 0)} className={cn(inputClass, "tabular max-w-40")} />;
    case "boolean":
      return (
        <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
          <input type="checkbox" name={field.name} defaultChecked={Boolean(value)} className="size-5 accent-[var(--sisfor)]" />
          {field.label}
        </label>
      );
    case "color":
      return <input {...common} type="color" defaultValue={String(value || "#a3191f")} className="h-11 w-20 cursor-pointer rounded-lg border border-input bg-white p-1" />;
    case "select":
      return (
        <select name={field.name} defaultValue={String(value ?? field.options?.[0]?.value ?? "")} className={inputClass}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "tags":
      return <input {...common} defaultValue={Array.isArray(value) ? value.join(", ") : ""} className={inputClass} />;
    case "socials":
      return (
        <textarea
          {...common}
          rows={4}
          defaultValue={Array.isArray(value) ? (value as { label: string; url: string }[]).map((s) => `${s.label} | ${s.url}`).join("\n") : ""}
          className={cn(inputClass, "font-mono text-sm")}
        />
      );
    case "image":
      return <ImageField field={field} value={String(value ?? "")} ctx={ctx} />;
    case "images":
      return <ImagesField field={field} value={Array.isArray(value) ? (value as string[]) : []} ctx={ctx} />;
    case "audio":
      return <AudioField field={field} value={String(value ?? "")} ctx={ctx} />;
    case "icon":
      return <IconField field={field} value={String(value ?? "")} />;
    default:
      return <input {...common} type={field.type === "url" ? "url" : field.type === "email" ? "email" : "text"} defaultValue={String(value ?? "")} className={inputClass} />;
  }
}

export function EntityForm({ entity, id, values, uploadsEnabled }: { entity: EntityKey; id: number | null; values: Values; uploadsEnabled: boolean }) {
  const config = ENTITIES[entity];
  const toast = useToast();
  const [busy, setBusyCount] = useState(0);
  const setBusy = useCallback((delta: number) => setBusyCount((n) => Math.max(0, n + delta)), []);
  const [ctx] = useState<UploadCtx>(() => ({ enabled: uploadsEnabled, folder: entity, setBusy }));

  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await saveEntity(entity, id, prev, fd);
    if (result?.error) toast({ tone: "error", title: "Belum tersimpan", description: result.error });
    return result;
  }, null);

  return (
    <form action={action} className="mt-8 grid gap-6 rounded-2xl bg-card p-5 ring-1 ring-border sm:grid-cols-2 sm:p-8">
      {config.fields.map((field) => (
        <div key={field.name} className={cn("grid min-w-0 content-start gap-1.5", (field.wide || field.type === "icon") && "sm:col-span-2")}>
          {field.type !== "boolean" ? (
            <span className="text-sm font-semibold text-ink">
              {field.label}
              {field.required ? <span className="text-sisfor"> *</span> : null}
            </span>
          ) : null}
          <FieldInput field={field} value={values[field.name]} ctx={ctx} />
          {field.help ? <span className="text-xs text-ink-soft">{field.help}</span> : null}
        </div>
      ))}

      {state?.error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive sm:col-span-2">
          {state.error}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center gap-2 rounded-b-2xl border-t border-border bg-card/95 px-5 py-4 backdrop-blur sm:col-span-2 sm:-mx-8 sm:-mb-8 sm:px-8">
        <button type="submit" disabled={pending || busy > 0} className={buttonPrimary}>
          {pending ? "Menyimpan..." : busy > 0 ? "Menunggu upload..." : "Simpan"}
        </button>
        {!config.singleton ? (
          <Link href={`/admin/${entity}`} className={buttonGhost}>
            Batal
          </Link>
        ) : null}
      </div>
    </form>
  );
}
