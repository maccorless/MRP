"use server";

import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, auditLog, adminUsers } from "@/db/schema";
import { requireIocAdminSession, requireWritable } from "@/lib/session";

export async function createApiKey(
  formData: FormData,
): Promise<{ error: string } | { rawKey: string }> {
  await requireWritable();
  const session = await requireIocAdminSession();

  const userEmail = (formData.get("user_email") as string)?.trim().toLowerCase();
  const label = (formData.get("label") as string)?.trim();
  const expiresStr = (formData.get("expires_at") as string)?.trim();

  if (!userEmail) return { error: "User email is required." };
  if (!label) return { error: "label is required." };

  const [user] = await db
    .select({ id: adminUsers.id, role: adminUsers.role, nocCode: adminUsers.nocCode })
    .from(adminUsers)
    .where(eq(adminUsers.email, userEmail))
    .limit(1);

  if (!user) return { error: `No admin user found for "${userEmail}".` };

  const rawKey = `prp_${randomBytes(16).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 8);
  const expiresAt = expiresStr ? new Date(expiresStr) : null;

  await db.insert(apiKeys).values({ keyHash, keyPrefix, userId: user.id, label, expiresAt });

  await db.insert(auditLog).values({
    actorType: "ioc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "api_key_created",
    detail: `API key "${label}" created for ${userEmail}`,
  });

  return { rawKey };
}

export async function revokeApiKey(formData: FormData): Promise<void> {
  await requireWritable();
  const session = await requireIocAdminSession();

  const keyId = formData.get("key_id") as string;
  if (!keyId) redirect("/admin/ioc/api-keys?error=missing_id");

  const now = new Date();
  const [updated] = await db
    .update(apiKeys)
    .set({ revokedAt: now })
    .where(and(eq(apiKeys.id, keyId), isNull(apiKeys.revokedAt)))
    .returning({ id: apiKeys.id, label: apiKeys.label });

  if (!updated) redirect("/admin/ioc/api-keys?error=not_found");

  await db.insert(auditLog).values({
    actorType: "ioc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "api_key_revoked",
    detail: `API key "${updated.label}" revoked`,
  });

  redirect("/admin/ioc/api-keys?success=revoked");
}
