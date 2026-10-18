import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityForm } from "@/components/admin/EntityForm";
import { ENTITIES, isEntityKey } from "@/lib/cms/config";
import { getRow } from "@/lib/cms/tables";
import { storageReady } from "@/lib/storage";

export default async function EntityEditPage({ params }: PageProps<"/admin/[entity]/[id]">) {
  const { entity, id } = await params;
  if (!isEntityKey(entity)) notFound();
  const config = ENTITIES[entity];

  const isNew = id === "new";
  if (isNew && !config.canCreate) notFound();
  const numericId = isNew ? null : Number(id);
  if (!isNew && !Number.isInteger(numericId)) notFound();

  const row = numericId ? await getRow(entity, numericId) : null;
  if (!isNew && !row) notFound();

  return (
    <div className="max-w-4xl">
      <Link href={`/admin/${entity}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} /> {config.label}
      </Link>
      <h1 className="mt-3 font-display text-4xl font-extrabold text-ink">
        {isNew ? `Tambah ${config.singular.toLowerCase()}` : `Ubah ${config.singular.toLowerCase()}`}
      </h1>
      <EntityForm entity={entity} id={numericId} values={row ?? {}} uploadsEnabled={storageReady()} />
    </div>
  );
}
