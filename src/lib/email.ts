"use server";

/**
 * Email service stub.
 * In dev: logs the call to stdout.
 * In prod: POSTs to the LA28 email service endpoint (EMAIL_SERVICE_URL env var).
 *
 * All emails use the la28.org sender domain (EMAIL_FROM_DOMAIN env var).
 * Endpoint URL and sender domain are provided by LA28 TEC — not hardcoded.
 */

export type EmailType = "eoi_receipt" | "invite" | "magic_link";

export interface EoiReceiptPayload {
  to: string;
  contactName: string;
  referenceNumber: string;
  nocCode: string;
  lang: "EN" | "FR" | "ES";
}

export interface InvitePayload {
  to: string;
  inviteUrl: string;
  nocCode: string;
  senderName?: string;
}

export interface MagicLinkPayload {
  to: string;
  token: string;
  lang?: "EN" | "FR" | "ES";
}

type EmailPayload = EoiReceiptPayload | InvitePayload | MagicLinkPayload;

export interface EmailPreview {
  to: string;
  subject: string;
  body: string;
}

function formatPreview(type: EmailType, payload: EmailPayload): EmailPreview {
  const fromDomain = process.env.EMAIL_FROM_DOMAIN ?? "la28.org";
  if (type === "eoi_receipt") {
    const p = payload as EoiReceiptPayload;
    return {
      to: p.to,
      subject: `[${p.nocCode}] Your press accreditation application has been received`,
      body: `Dear ${p.contactName},\n\nYour Expression of Interest (${p.referenceNumber}) has been received and is under review by the ${p.nocCode} accreditation team.\n\nYou will hear directly from your NOC. To check your application status, use the link in this email or your original confirmation.\n\nThe PRP Team\nnoreply@${fromDomain}`,
    };
  }
  if (type === "invite") {
    const p = payload as InvitePayload;
    return {
      to: p.to,
      subject: `You've been invited to complete your LA 2028 press accreditation application`,
      body: `You have been invited by ${p.senderName ?? p.nocCode} to complete your Press Registration Portal application.\n\nClick here to access your application:\n${p.inviteUrl}\n\nThe PRP Team\nnoreply@${fromDomain}`,
    };
  }
  const p = payload as MagicLinkPayload;
  const statusUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://prp.la28.org"}/apply/status/view?token=${p.token}&email=`;
  return {
    to: p.to,
    subject: `Your LA 2028 press accreditation status link`,
    body: `Here is your link to check the status of your press accreditation application:\n${statusUrl}[your email]\n\nThis link is valid for 24 hours.\n\nThe PRP Team\nnoreply@${fromDomain}`,
  };
}

export async function sendEmail(
  type: EmailType,
  payload: EmailPayload,
): Promise<{ ok: boolean; error?: string; preview: EmailPreview }> {
  const preview = formatPreview(type, payload);
  const endpoint = process.env.EMAIL_SERVICE_URL;

  if (!endpoint) {
    console.log(
      `[email stub] type=${type} to=${preview.to} subject="${preview.subject}"`,
    );
    return { ok: true, preview };
  }

  try {
    const fromDomain = process.env.EMAIL_FROM_DOMAIN ?? "la28.org";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, fromDomain, payload }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "(no body)");
      console.error(`[email] service error type=${type} status=${res.status} body=${text}`);
      return { ok: false, error: `Email service returned ${res.status}`, preview };
    }
    return { ok: true, preview };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[email] fetch failed type=${type} error=${msg}`);
    return { ok: false, error: msg, preview };
  }
}
