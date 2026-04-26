/**
 * Tiny DB helper for E2E specs that need to seed real rows.
 *
 * Avoids the @/db / drizzle path-alias entanglement; just reads
 * DATABASE_URL out of .env.local and exposes a postgres-js connection.
 */

import * as fs from "fs";
import * as path from "path";
import postgres from "postgres";

let cachedClient: ReturnType<typeof postgres> | null = null;

export function loadDbUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // Walk up from this file looking for .env.local (covers run-from-any-cwd).
  const candidates = [
    path.resolve(__dirname, "../../.env.local"),
    path.resolve(process.cwd(), ".env.local"),
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const txt = fs.readFileSync(candidate, "utf8");
    for (const rawLine of txt.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  }

  throw new Error("DATABASE_URL not found in environment or .env.local");
}

export function sql() {
  if (!cachedClient) {
    cachedClient = postgres(loadDbUrl(), { max: 5, idle_timeout: 5, connect_timeout: 10 });
  }
  return cachedClient;
}

export async function closeDb() {
  if (cachedClient) {
    await cachedClient.end({ timeout: 5 });
    cachedClient = null;
  }
}
