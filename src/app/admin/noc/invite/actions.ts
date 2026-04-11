"use server";

import { db } from "@/db";
import { invitations, auditLog } from "@/db/schema";
import { requireNocSession, requireWritable } from "@/lib/session";
import { generateToken, hashToken } from "@/lib/tokens";

export type InviteActionState = {
  inviteUrl: string | null;
  inviteId: string | null;
  error: string | null;
};

export async function createInvitation(
  _prev: InviteActionState,
  formData: FormData
): Promise<InviteActionState> {
  try {
    await requireWritable();
  } catch {
    return { inviteUrl: null, inviteId: null, error: "You do not have permission to perform this action." };
  }

  let session: Awaited<ReturnType<typeof requireNocSession>>;
  try {
    session = await requireNocSession();
  } catch {
    return { inviteUrl: null, inviteId: null, error: "Session expired. Please log in again." };
  }

  const orgName        = (formData.get("org_name") as string)?.trim() || null;
  const orgType        = (formData.get("org_type") as string)?.trim() || null;
  const country        = (formData.get("country") as string)?.trim() || null;
  const website        = (formData.get("website") as string)?.trim() || null;
  const recipientEmail = (formData.get("recipient_email") as string)?.trim().toLowerCase() || null;

  if (recipientEmail && (!recipientEmail.includes("@") || !recipientEmail.includes("."))) {
    return { inviteUrl: null, inviteId: null, error: "Please enter a valid email address." };
  }

  const VALID_ORG_TYPES = ["media_print_online", "media_broadcast", "news_agency", "freelancer"];
  if (orgType && !VALID_ORG_TYPES.includes(orgType)) {
    return { inviteUrl: null, inviteId: null, error: "Invalid organisation type selected." };
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiryDays = parseInt(process.env.INVITE_EXPIRY_DAYS ?? "7", 10);
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  const prefillData: Record<string, string> = {};
  if (orgName)    prefillData.orgName = orgName;
  if (orgType)    prefillData.orgType = orgType;
  if (country)    prefillData.orgCountry = country;
  if (website)    prefillData.orgWebsite = website;
  // Always include the NOC code so the form is pre-addressed to the right NOC
  prefillData.orgNocCode = session.nocCode;

  const [row] = await db
    .insert(invitations)
    .values({
      tokenHash,
      nocCode: session.nocCode,
      createdBy: session.userId,
      prefillData,
      recipientEmail,
      expiresAt,
    })
    .returning({ id: invitations.id });

  await db.insert(auditLog).values({
    actorType: "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "invitation_created",
    detail: `Invite created for ${orgName ?? "(no org name)"} — ${recipientEmail ?? "no email"} (NOC: ${session.nocCode})`,
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${rawToken}`;

  return { inviteUrl, inviteId: row.id, error: null };
}
