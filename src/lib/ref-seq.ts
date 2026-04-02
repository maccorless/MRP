/**
 * Atomic application reference number sequence generator.
 *
 * Uses an upsert-based counter per NOC code to avoid the race condition
 * where two concurrent submissions compute the same COUNT(*)+1 sequence
 * and one fails with a unique constraint violation.
 *
 * Postgres ON CONFLICT DO UPDATE holds a row-level lock, so this is safe
 * for concurrent callers without any additional transaction wrapper.
 *
 * Usage:
 *   const referenceNumber = await nextApplicationRef(nocCode);
 *   // → "APP-2028-USA-00042"
 */

import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function nextApplicationRef(nocCode: string): Promise<string> {
  const result = await db.execute(sql`
    INSERT INTO application_sequences (noc_code, seq)
    VALUES (${nocCode}, 1)
    ON CONFLICT (noc_code)
    DO UPDATE SET seq = application_sequences.seq + 1
    RETURNING seq
  `);

  if (!result[0]) throw new Error("ref-seq: no row returned from sequence upsert");
  const seq = Number((result[0] as { seq: number | string }).seq);
  return `APP-2028-${nocCode}-${String(seq).padStart(5, "0")}`;
}
