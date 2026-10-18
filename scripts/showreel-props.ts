/* Ambil data asli dari database → out/showreel-props.json untuk Remotion Studio & render.
   Dijalankan otomatis oleh `npm run remotion` dan `npm run remotion:render`. */
import { config } from "dotenv";
import { asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { mkdirSync, writeFileSync } from "node:fs";
import postgres from "postgres";
import * as s from "../src/lib/db/schema";
import { toShowreelProps } from "../src/remotion/fromData";

config({ path: ".env.local" });

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", max: 1 });
  const db = drizzle(sql, { schema: s });
  try {
    const [profile, chapters, milestones, skills, projects] = await Promise.all([
      db.select().from(s.profile).limit(1),
      db.select().from(s.chapters),
      db.select().from(s.milestones).orderBy(asc(s.milestones.sortOrder)),
      db.select().from(s.skills).orderBy(asc(s.skills.sortOrder)),
      db.select().from(s.projects).orderBy(asc(s.projects.sortOrder)),
    ]);
    const props = toShowreelProps({
      profile: profile[0] ?? null,
      chapters: Object.fromEntries(chapters.map((c) => [c.key, c])),
      milestones,
      skills,
      projects,
    });
    mkdirSync("out", { recursive: true });
    writeFileSync("out/showreel-props.json", JSON.stringify(props, null, 2));
    console.log(
      `showreel-props.json: ${props.milestones.length} milestone, ${props.skills.length} skill, ${props.projects.length} proyek`,
    );
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error("Gagal mengambil data showreel:", e instanceof Error ? e.message : e);
  process.exit(1);
});
