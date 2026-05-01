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

export async function sendEmail(
  type: EmailType,
  payload: EmailPayload,
): Promise<{ ok: boolean; error?: string }> {
  const endpoint = process.env.EMAIL_SERVICE_URL;
  const fromDomain = process.env.EMAIL_FROM_DOMAIN ?? "la28.org";

  if (!endpoint) {
    console.log(
      `[email stub] type=${type} from=noreply@${fromDomain} payload=${JSON.stringify(payload)}`,
    );
    return { ok: true };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, fromDomain, payload }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "(no body)");
      console.error(`[email] service error type=${type} status=${res.status} body=${text}`);
      return { ok: false, error: `Email service returned ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[email] fetch failed type=${type} error=${msg}`);
    return { ok: false, error: msg };
  }
}
