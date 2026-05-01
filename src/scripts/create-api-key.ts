/**
 * CLI script to create an API key for an admin user.
 *
 * Usage:
 *   bun run create-api-key --user=<email> --label="Claude Desktop"
 *   bun run create-api-key --user=<email> --label="Claude Desktop" --expires=2026-12-31
 *
 * The raw key is shown exactly once. Store it securely.
 */

import { randomBytes, createHash } from "crypto";
import postgres from "postgres";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) =>
    args.find((a) => a.startsWith(`--${flag}=`))?.split("=").slice(1).join("=");

  const user = get("user");
  const label = get("label");
  const expires = get("expires");

  if (!user || !label) {
    console.error("Usage: bun run create-api-key --user=<email> --label=<name> [--expires=YYYY-MM-DD]");
    process.exit(1);
  }

  return { user, label, expires: expires ? new Date(expires) : null };
}

async function main() {
  const { user, label, expires } = parseArgs();
  const sql = postgres(DATABASE_URL!, { max: 1 });

  try {
    const [adminUser] = await sql<{ id: string; role: string; noc_code: string | null }[]>`
      SELECT id, role, noc_code FROM admin_users WHERE email = ${user}
    `;

    if (!adminUser) {
      console.error(`ERROR: No admin user found with email: ${user}`);
      process.exit(1);
    }

    const rawKey = `prp_${randomBytes(16).toString("hex")}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 8);

    await sql`
      INSERT INTO api_keys (key_hash, key_prefix, user_id, label, expires_at)
      VALUES (${keyHash}, ${keyPrefix}, ${adminUser.id}, ${label}, ${expires})
    `;

    console.log("\n✓ API key created\n");
    console.log(`  User:    ${user} (${adminUser.role}${adminUser.noc_code ? ` / ${adminUser.noc_code}` : ""})`);
    console.log(`  Label:   ${label}`);
    console.log(`  Prefix:  ${keyPrefix}...`);
    console.log(`  Expires: ${expires ? expires.toISOString().slice(0, 10) : "never"}`);
    console.log(`\n  KEY (shown once — store securely):\n`);
    console.log(`  ${rawKey}\n`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
