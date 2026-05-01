"use server";

import { db } from "@/db";
import { invitations, auditLog } from "@/db/schema";
import { NOC_CODES } from "@/lib/codes";
import { requireBaseUrl } from "@/lib/env";
import { requireNocSession, requireWritable } from "@/lib/session";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";

export type InviteActionState = {
  inviteUrl: string | null;
  inviteId: string | null;
  emailTo: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  emailSent: boolean;
  error: string | null;
};

function composeInviteEmail(opts: {
  inviteUrl: string;
  orgName: string | null;
  nocCode: string;
  adminDisplayName: string;
  expiryDays: number;
}): { subject: string; body: string } {
  const nocName = NOC_CODES.find((n) => n.code === opts.nocCode)?.name ?? opts.nocCode;
  const orgLine = opts.orgName ? opts.orgName : "your organisation";
  const subject = `Invitation to apply for LA 2028 Olympic Press Accreditation`;
  const body = [
    `Hello,`,
    ``,
    `The ${nocName} National Olympic Committee has invited ${orgLine} to submit an Expression of Interest (EoI) for press accreditation at the Olympic Games LA 2028.`,
    ``,
    `To begin your application, click the link below. This invitation is single-use and will expire in ${opts.expiryDays} days.`,
    ``,
    opts.inviteUrl,
    ``,
    `If you have any questions, please contact your NOC representative.`,
    ``,
    `Kind regards,`,
    opts.adminDisplayName,
    `${nocName} — Press Accreditation Team`,
  ].join("\n");
  return { subject, body };
}

export async function createInvitation(
  _prev: InviteActionState,
  formData: FormData
): Promise<InviteActionState> {
  const blank = { inviteUrl: null, inviteId: null, emailTo: null, emailSubject: null, emailBody: null, emailSent: false };
  try {
    await requireWritable();
  } catch {
    return { ...blank, error: "You do not have permission to perform this action." };
  }

  let session: Awaited<ReturnType<typeof requireNocSession>>;
  try {
    session = await requireNocSession();
  } catch {
    return { ...blank, error: "Session expired. Please log in again." };
  }

  const orgName        = (formData.get("org_name") as string)?.trim() || null;
  const orgType        = (formData.get("org_type") as string)?.trim() || null;
  const country        = (formData.get("country") as string)?.trim() || null;
  const rawWebsite     = (formData.get("website") as string)?.trim() || null;
  const website        = rawWebsite === "https://" ? null : rawWebsite;
  const recipientEmail = (formData.get("recipient_email") as string)?.trim().toLowerCase() || null;

  if (recipientEmail && (!recipientEmail.includes("@") || !recipientEmail.includes("."))) {
    return { ...blank, error: "Please enter a valid email address." };
  }

  const VALID_ORG_TYPES = ["media_print_online", "media_broadcast", "news_agency", "freelancer"];
  if (orgType && !VALID_ORG_TYPES.includes(orgType)) {
    return { ...blank, error: "Invalid organisation type selected." };
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

  const baseUrl = requireBaseUrl();
  const inviteUrl = `${baseUrl}/invite/${rawToken}`;

  const { subject: emailSubject, body: emailBody } = composeInviteEmail({
    inviteUrl,
    orgName,
    nocCode: session.nocCode,
    adminDisplayName: session.displayName,
    expiryDays,
  });

  let emailSent = false;
  if (recipientEmail) {
    const result = await sendEmail("invite", {
      to: recipientEmail,
      inviteUrl,
      nocCode: session.nocCode,
      senderName: session.displayName,
    });
    emailSent = result.ok;
  }

  return {
    inviteUrl,
    inviteId: row.id,
    emailTo: recipientEmail,
    emailSubject,
    emailBody,
    emailSent,
    error: null,
  };
}
