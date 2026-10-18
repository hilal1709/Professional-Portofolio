import { PlusSignIcon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { EntityForm } from "@/components/admin/EntityForm";
import { SavedNotice } from "@/components/admin/SavedNotice";
import { buttonPrimary } from "@/components/admin/styles";
import { ENTITIES, isEntityKey } from "@/lib/cms/config";
import { listRows } from "@/lib/cms/tables";
import { storageReady } from "@/lib/storage";

export async function generateMetadata({ params }: PageProps<"/admin/[entity]">) {
  const { entity } = await params;
  return { title: isEntityKey(entity) ? ENTITIES[entity].label : "CMS" };
}

function Cell({ value }: { value: unknown }) {
  if (typeof value === "boolean") return <span className={value ? "font-semibold text-leaf" : "text-ink-soft"}>{value ? "Ya" : "Tidak"}</span>;
  if (typeof value === "string" && /^(https?:\/\/|\/).*\.(jpe?g|png|webp|gif|avif|svg)(\?.*)?$/i.test(value)) {
    return (
      <span className="relative block size-12 overflow-hidden rounded-md bg-paper-deep">
        <Image src={value} alt="" fill sizes="48px" className="object-cover" />
      </span>
    );
  }
  return <span className="line-clamp-2">{String(value ?? "")}</span>;
}

export default async function EntityListPage({ params, searchParams }: PageProps<"/admin/[entity]">) {
  const { entity } = await params;
  const { saved } = await searchParams;
  if (!isEntityKey(entity)) notFound();
  const config = ENTITIES[entity];
  const rows = await listRows(entity);

  if (config.singleton) {
    const row = rows[0] ?? null;
    return (
      <div className="max-w-4xl">
        <h1 className="font-display text-4xl font-extrabold text-ink">{config.label}</h1>
        <p className="mt-1 text-ink-soft">{config.description}</p>
        {saved ? <SavedNotice /> : null}
        <EntityForm entity={entity} id={row?.id ?? null} values={row ?? {}} uploadsEnabled={storageReady()} />
      </div>
    );
  }

  const labelOf = (name: string) => config.fields.find((f) => f.name === name)?.label ?? name;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-ink">{config.label}</h1>
          <p className="mt-1 text-ink-soft">{config.description}</p>
        </div>
        {config.canCreate ? (
          <Link href={`/admin/${entity}/new`} className={buttonPrimary}>
            <HugeiconsIcon icon={PlusSignIcon} size={18} /> Tambah {config.singular.toLowerCase()}
          </Link>
        ) : null}
      </div>
      {saved ? <SavedNotice /> : null}

      {rows.length === 0 ? (
        <p className="mt-8 rounded-xl bg-card px-5 py-10 text-center text-ink-soft ring-1 ring-border">
          Belum ada data. {config.canCreate ? "Klik “Tambah” untuk membuat yang pertama." : ""}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl bg-card ring-1 ring-border">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-border text-ink-soft">
              <tr>
                {config.columns.map((c) => (
                  <th key={c} scope="col" className="px-4 py-3 font-semibold">
                    {labelOf(c)}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="align-middle text-ink hover:bg-paper/60">
                  {config.columns.map((c) => (
                    <td key={c} className={`px-4 py-3 ${c === "sortOrder" || c === "level" ? "tabular w-20" : ""}`}>
                      <Cell value={row[c]} />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/admin/${entity}/${row.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-ink-soft hover:bg-paper-deep hover:text-ink"
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} size={16} /> Ubah
                      </Link>
                      {config.canDelete ? <DeleteButton entity={entity} id={row.id} label={config.singular.toLowerCase()} /> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
