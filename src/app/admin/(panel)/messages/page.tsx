import { desc } from "drizzle-orm";
import { MessageActions } from "@/components/admin/MessageActions";
import { db, messages } from "@/lib/db";

export const metadata = { title: "Pesan masuk" };

const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default async function MessagesPage() {
  const rows = await db.select().from(messages).orderBy(desc(messages.createdAt));
  const unread = rows.filter((r) => !r.read).length;

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl font-extrabold text-ink">Pesan masuk</h1>
      <p className="mt-1 text-ink-soft">
        {rows.length} pesan · <span className="tabular">{unread}</span> belum dibaca
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-xl bg-card px-5 py-10 text-center text-ink-soft ring-1 ring-border">
          Belum ada pesan. Form kontak di babak terakhir beranda akan mengirim pesan ke sini.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {rows.map((m) => (
            <li key={m.id} className={`rounded-xl bg-card p-5 ring-1 ${m.read ? "ring-border" : "ring-sisfor/40"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {!m.read ? <span className="mr-2 inline-block size-2 rounded-full bg-sisfor align-middle" aria-label="Belum dibaca" /> : null}
                    {m.name}
                  </p>
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent("Balasan dari portofolio Hilal")}`} className="text-sm font-semibold text-sisfor hover:underline">
                    {m.email}
                  </a>
                </div>
                <time className="tabular text-sm text-ink-soft">{fmt.format(m.createdAt)}</time>
              </div>
              <p className="mt-3 max-w-[70ch] whitespace-pre-line leading-relaxed text-ink">{m.body}</p>
              <MessageActions id={m.id} read={m.read} from={m.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
