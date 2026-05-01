/**
 * One-time bootstrap endpoint to create the PRP admin test account.
 * Protected by BOOTSTRAP_SECRET env var — delete this file after use.
 *
 * Usage: GET /api/admin/bootstrap?secret=<BOOTSTRAP_SECRET>
 */

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers, userRoles } from "@/db/schema";

export const dynamic = "force-dynamic";

// bcrypt hash of "Password1!" — same value used by all prototype accounts
const PROTO_PW_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhu2";

const EMAIL = "prp.admin@la28.org";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.BOOTSTRAP_SECRET;

  if (!expected) {
    return Response.json({ error: "BOOTSTRAP_SECRET env var not set" }, { status: 403 });
  }
  if (secret !== expected) {
    return Response.json({ error: "Invalid secret" }, { status: 403 });
  }

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, EMAIL));

  let userId: string;
  let created = false;

  if (existing) {
    userId = existing.id;
  } else {
    const [row] = await db
      .insert(adminUsers)
      .values({
        email: EMAIL,
        role: "ioc_admin",
        displayName: "PRP Admin",
        passwordHash: PROTO_PW_HASH,
      })
      .returning({ id: adminUsers.id });
    userId = row.id;
    created = true;
  }

  const [existingRole] = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  let roleGranted = false;
  if (!existingRole) {
    await db.insert(userRoles).values({ userId, role: "prp_admin", grantedBy: userId });
    roleGranted = true;
  }

  return Response.json({
    ok: true,
    email: EMAIL,
    password: "Password1!",
    userCreated: created,
    roleGranted,
    message: created
      ? "Account created. Log in at /admin/login"
      : "Account already existed. Role granted if missing.",
  });
}
