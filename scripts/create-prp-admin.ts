/**
 * Creates a PRP Admin test account without touching any existing data.
 * Run: bun scripts/create-prp-admin.ts
 *
 * Creates:
 *   - admin_users row:  prp.admin@la28.org / Password1! / ioc_admin role
 *   - user_roles row:   prp_admin additional role (triggers PRP Admin nav)
 *
 * Idempotent — safe to run multiple times.
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from "@/db";
import { adminUsers, userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

const EMAIL = "prp.admin@la28.org";
const DISPLAY_NAME = "PRP Admin";
// bcrypt hash of "Password1!" — same value used by all prototype accounts
const PROTO_PW_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhu2";

async function main() {
  // Check if user already exists
  const [existing] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, EMAIL));

  let userId: string;

  if (existing) {
    userId = existing.id;
    console.log(`User already exists: ${EMAIL} (${userId})`);
  } else {
    const [created] = await db
      .insert(adminUsers)
      .values({
        email: EMAIL,
        role: "ioc_admin",
        displayName: DISPLAY_NAME,
        passwordHash: PROTO_PW_HASH,
      })
      .returning({ id: adminUsers.id });

    userId = created.id;
    console.log(`Created user: ${EMAIL} (${userId})`);
  }

  // Grant prp_admin additional role (idempotent)
  const [existingRole] = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  if (existingRole) {
    console.log(`prp_admin role already granted.`);
  } else {
    await db.insert(userRoles).values({
      userId,
      role: "prp_admin",
      grantedBy: userId,
    });
    console.log(`Granted prp_admin role.`);
  }

  console.log("");
  console.log("Login details:");
  console.log(`  Email:    ${EMAIL}`);
  console.log("  Password: Password1!");
  console.log("  Routes to: /admin/ioc (IOC dashboard + PRP Admin nav)");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
