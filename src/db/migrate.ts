/**
 * Custom migration runner.
 * Reads all .sql files from src/db/migrations/ in alphabetical order.
 * Tracks applied migrations by filename in a _migrations table.
 * Safe to re-run: skips any file already recorded as applied.
 *
 * Bootstrap: if _migrations is empty but the DB already has the applications
 * table, we seed the tracking table with the known-applied migrations so they
 * aren't re-run destructively.
 */

import postgres from "postgres";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

async function run() {
  // Ensure tracking table exists
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         serial PRIMARY KEY,
      filename   text NOT NULL UNIQUE,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  // Bootstrap: if tracking table is empty but DB is already set up from
  // previous drizzle-kit runs, seed with migrations known to be applied.
  const [trackCount] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM _migrations
  `;
  const [appTableExists] = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'applications'
    ) AS exists
  `;

  if (trackCount.count === "0" && appTableExists.exists) {
    console.log("Bootstrapping migration tracker from existing DB state...");
    // Check column-by-column to determine which migrations have already run
    const checkCol = async (table: string, col: string) => {
      const [r] = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = ${table} AND column_name = ${col}
        ) AS exists
      `;
      return r.exists;
    };

    const seeded: string[] = [];

    // 0000: applications table existing means 0000 ran
    seeded.push("0000_strong_otto_octavius.sql");

    // 0001: check for a column added in 0001 (e.g. review_note)
    if (await checkCol("applications", "review_note")) {
      seeded.push("0001_v1_foundation.sql");
    }

    // 0002: check for requested_press
    if (await checkCol("applications", "requested_press")) {
      seeded.push("0002_noc_workflow_v2.sql");
    }

    // 0003: check for contact_first_name
    if (await checkCol("applications", "contact_first_name")) {
      seeded.push("0003_eoi_expanded_fields.sql");
    }

    // 0004: check for category_e
    if (await checkCol("applications", "category_e")) {
      seeded.push("0004_categories_reserved_orgs.sql");
    }

    for (const f of seeded) {
      await sql`
        INSERT INTO _migrations (filename) VALUES (${f})
        ON CONFLICT DO NOTHING
      `;
      console.log(`  seeded ${f}`);
    }
  }

  // Read all SQL files in order
  const migrationsDir = join(process.cwd(), "src/db/migrations");
  const allFiles = await readdir(migrationsDir);
  const sqlFiles = allFiles
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // Fetch already-applied migrations
  const applied = await sql<{ filename: string }[]>`
    SELECT filename FROM _migrations
  `;
  const appliedSet = new Set(applied.map((r) => r.filename));

  let count = 0;
  for (const file of sqlFiles) {
    if (appliedSet.has(file)) {
      console.log(`  skip  ${file}`);
      continue;
    }

    const content = await readFile(join(migrationsDir, file), "utf-8");
    console.log(`  apply ${file}`);

    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`INSERT INTO _migrations (filename) VALUES (${file})`;
    });

    count++;
  }

  console.log(`Migrations complete: ${count} applied, ${appliedSet.size} already done.`);
  await sql.end();
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
