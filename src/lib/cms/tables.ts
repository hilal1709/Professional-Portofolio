import "server-only";
import { asc, eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { chapters, db, experiences, gallery, milestones, profile, projects, skills } from "@/lib/db";
import type { EntityKey } from "./config";

type CmsTable = PgTable & { id: PgColumn };

/** Peta entitas CMS → tabel Drizzle. */
export const TABLES: Record<EntityKey, CmsTable> = {
  profile,
  chapters,
  milestones,
  skills,
  projects,
  experiences,
  gallery,
};

export type Row = Record<string, unknown> & { id: number };

export async function listRows(key: EntityKey): Promise<Row[]> {
  const table = TABLES[key];
  const order = "sortOrder" in table ? asc((table as unknown as { sortOrder: PgColumn }).sortOrder) : asc(table.id);
  return (await db.select().from(table).orderBy(order, asc(table.id))) as Row[];
}

export async function getRow(key: EntityKey, id: number): Promise<Row | null> {
  const table = TABLES[key];
  const rows = (await db.select().from(table).where(eq(table.id, id)).limit(1)) as Row[];
  return rows[0] ?? null;
}
