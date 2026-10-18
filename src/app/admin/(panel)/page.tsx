import { count, desc } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import Link from "next/link";
import { Banner } from "@/components/feedback/Banner";
import { db, experiences, gallery, messages, milestones, projects, skills } from "@/lib/db";
import { storageReady } from "@/lib/storage";

export const metadata = { title: "Ringkasan" };

const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default async function AdminHome() {
  const tally = async (t: PgTable) => (await db.select({ value: count() }).from(t))[0].value;

  const [p, s, m, e, g, latest] = await Promise.all([
    tally(projects),
    tally(skills),
    tally(milestones),
    tally(experiences),
    tally(gallery),
    db.select().from(messages).orderBy(desc(messages.createdAt)).limit(5),
  ]);

  const stats = [
    ["Proyek", p, "/admin/projects"],
    ["Skill", s, "/admin/skills"],
    ["Milestone", m, "/admin/milestones"],
    ["Pengalaman", e, "/admin/experiences"],
    ["Foto galeri", g, "/admin/gallery"],
  ] as const;

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-4xl font-extrabold text-ink">Halo, Hilal</h1>
      <p className="mt-1 text-ink-soft">Semua perubahan di sini langsung memperbarui cerita di beranda.</p>

      {!storageReady() ? (
        <Banner tone="warning" title="Upload gambar & lagu belum aktif" className="mt-6">
          Isi kunci <code>service_role</code> (Supabase → Project Settings → API) ke <code>SUPABASE_SERVICE_ROLE_KEY</code> di{" "}
          <code>.env.local</code>, lalu restart server. Kunci itu rahasia: jangan dibagikan atau di-commit. Sementara itu kamu tetap bisa menempelkan URL
          file.
        </Banner>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border sm:grid-cols-5">
        {stats.map(([label, value, href]) => (
          <Link key={label} href={href} className="bg-card px-5 py-4 transition-colors hover:bg-paper-deep">
            <dt className="text-sm font-semibold text-ink-soft">{label}</dt>
            <dd className="tabular mt-1 font-display text-3xl font-bold text-ink">{value}</dd>
          </Link>
        ))}
      </dl>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">Pesan terbaru</h2>
          <Link href="/admin/messages" className="text-sm font-semibold text-sisfor hover:underline">
            Semua pesan
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="mt-4 rounded-xl bg-card px-5 py-8 text-center text-ink-soft ring-1 ring-border">
            Belum ada pesan. Pesan dari form kontak akan muncul di sini.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-border">
            {latest.map((msg) => (
              <li key={msg.id} className="flex gap-4 px-5 py-4">
                <span className={`mt-2 size-2 shrink-0 rounded-full ${msg.read ? "bg-transparent" : "bg-sisfor"}`} aria-label={msg.read ? "Sudah dibaca" : "Belum dibaca"} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {msg.name} <span className="font-normal text-ink-soft">· {msg.email}</span>
                  </p>
                  <p className="truncate text-ink-soft">{msg.body}</p>
                </div>
                <time className="tabular shrink-0 text-sm text-ink-soft">{fmt.format(msg.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
