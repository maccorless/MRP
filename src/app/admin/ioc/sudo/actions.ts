"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers, sudoTokens, auditLog } from "@/db/schema";
import { getBaseSession, requireIocAdminSession } from "@/lib/session";

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );
  return Buffer.from(digest).toString("hex");
}

/**
 * Generates a one-time sudo token for the target email.
 * Returns the full URL to open in a new window.
 * Called from the IOC Admin "Act as user" form.
 */
export async function initiateSudo(formData: FormData): Promise<{ url: string } | { error: string }> {
  const session = await requireIocAdminSession();
  const targetEmail = (formData.get("target_email") as string)?.trim().toLowerCase();

  if (!targetEmail) return { error: "Email is required." };

  // Look up target admin user
  const [target] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, targetEmail))
    .limit(1);

  if (!target) {
    return { error: `No admin user found for "${targetEmail}". Applicant sudo is not yet supported.` };
  }

  if (target.role === "ioc_admin" || target.role === "ioc_readonly") {
    return { error: "Cannot sudo into another IOC admin account." };
  }

  const token = generateToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10-minute window to activate

  await db.insert(sudoTokens).values({
    tokenHash,
    actorId: session.userId,
    actorLabel: session.displayName,
    targetEmail: target.email,
    expiresAt,
  });

  await db.insert(auditLog).values({
    actorType: "ioc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "sudo_initiated",
    detail: `Sudo initiated as ${target.displayName} (${target.role}${target.nocCode ? ` · ${target.nocCode}` : ""})`,
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return { url: `${baseUrl}/admin/sudo/activate?token=${token}` };
}

/**
 * Clears the sudo session cookie. Called from the "Exit sudo" button.
 */
export async function exitSudo() {
  const { clearSudoSession } = await import("@/lib/session");
  await clearSudoSession();
  // Redirect to a neutral page rather than back to the target user's home
  redirect("/admin/sudo/exited");
}
