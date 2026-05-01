import { createHash } from "crypto";
import { eq, and, isNull, or, gt } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, adminUsers } from "@/db/schema";
import type { SessionPayload, AdminRole } from "@/lib/session";

/**
 * Validates a raw API key and returns the associated SessionPayload.
 * Returns null if the key is unknown, revoked, or expired.
 * Fire-and-forgets a lastUsedAt update on success.
 */
export async function buildContextFromApiKey(rawKey: string): Promise<SessionPayload | null> {
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const now = new Date();

  const [row] = await db
    .select({
      keyId: apiKeys.id,
      label: apiKeys.label,
      userId: adminUsers.id,
      email: adminUsers.email,
      role: adminUsers.role,
      nocCode: adminUsers.nocCode,
      ifCode: adminUsers.ifCode,
      displayName: adminUsers.displayName,
      canaryFlags: adminUsers.canaryFlags,
    })
    .from(apiKeys)
    .innerJoin(adminUsers, eq(apiKeys.userId, adminUsers.id))
    .where(
      and(
        eq(apiKeys.keyHash, keyHash),
        isNull(apiKeys.revokedAt),
        or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, now)),
      ),
    )
    .limit(1);

  if (!row) return null;

  void db
    .update(apiKeys)
    .set({ lastUsedAt: now })
    .where(eq(apiKeys.id, row.keyId))
    .catch(() => {});

  return {
    userId: row.userId,
    email: row.email,
    role: row.role as AdminRole,
    nocCode: row.nocCode ?? null,
    ifCode: row.ifCode ?? null,
    displayName: `${row.displayName} [API: ${row.label}]`,
    canaryFlags: Array.isArray(row.canaryFlags) ? (row.canaryFlags as string[]) : undefined,
    isSudo: false,
  };
}
