"use server";

import { redirect } from "next/navigation";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "@/db";
import { invitations, magicLinkTokens, auditLog } from "@/db/schema";
import { hashToken, generateToken } from "@/lib/tokens";

/**
 * Capture the recipient email for an invite that was created without one.
 * Saves the email to the invitation row and redirects back to the same invite URL.
 */
export async function captureInviteEmail(token: string, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email || !email.includes("@") || !email.includes(".")) {
    redirect(`/invite/${token}?error=invalid_email`);
  }

  const tokenHash = hashToken(token);
  const now = new Date();

  const [invite] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.tokenHash, tokenHash),
        isNull(invitations.usedAt),
        gt(invitations.expiresAt, now)
      )
    );

  if (!invite) {
    redirect(`/invite/${token}?error=invalid`);
  }

  await db
    .update(invitations)
    .set({ recipientEmail: email })
    .where(eq(invitations.id, invite.id));

  redirect(`/invite/${token}`);
}

/**
 * Exchange the invite token for a magic-link token and redirect to the form.
 * Called when recipientEmail is already known (or just captured).
 */
export async function redeemInvite(token: string) {
  const tokenHash = hashToken(token);
  const now = new Date();

  const [invite] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.tokenHash, tokenHash),
        isNull(invitations.usedAt),
        gt(invitations.expiresAt, now)
      )
    );

  if (!invite || !invite.recipientEmail) {
    redirect(`/invite/${token}?error=invalid`);
  }

  const email = invite.recipientEmail;
  const magicToken = generateToken();
  const magicTokenHash = hashToken(magicToken);
  const expiryHours = parseInt(process.env.TOKEN_EXPIRY_HOURS ?? "24", 10);
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    // Mark invite as used atomically
    const [consumed] = await tx
      .update(invitations)
      .set({ usedAt: now })
      .where(
        and(
          eq(invitations.tokenHash, tokenHash),
          isNull(invitations.usedAt),
          gt(invitations.expiresAt, now)
        )
      )
      .returning({ id: invitations.id });

    if (!consumed) {
      // Concurrent redemption — abort
      redirect(`/invite/${token}?error=already_used`);
    }

    // Create magic-link token (skip rate limits — NOC-authorised path)
    await tx.insert(magicLinkTokens).values({
      email,
      tokenHash: magicTokenHash,
      expiresAt,
    });

    // Write audit log
    await tx.insert(auditLog).values({
      actorType: "system",
      actorId: invite.nocCode,
      actorLabel: `Invite ${invite.id.slice(0, 8)}`,
      action: "invitation_accepted",
      detail: `Invite redeemed by ${email} (NOC: ${invite.nocCode})`,
    });
  });

  // Build prefill query params from invite's prefill data
  const prefill = (invite.prefillData as Record<string, string>) ?? {};
  const params = new URLSearchParams({
    token: magicToken,
    email,
    from: "invite",
  });
  if (prefill.orgName)    params.set("org_name", prefill.orgName);
  if (prefill.orgType)    params.set("org_type", prefill.orgType);
  if (prefill.orgCountry) params.set("country", prefill.orgCountry);
  if (prefill.orgNocCode) params.set("noc_code", prefill.orgNocCode);
  if (prefill.orgWebsite) params.set("website", prefill.orgWebsite);

  redirect(`/apply/form?${params.toString()}`);
}
