import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "@/db";
import { invitations } from "@/db/schema";
import { hashToken } from "@/lib/tokens";
import { captureInviteEmail, redeemInvite } from "./actions";

export default async function InviteLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const now = new Date();

  // Look up the invite
  const tokenHash = hashToken(token);
  const [invite] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.tokenHash, tokenHash));

  // ── Invalid / expired / already used ──────────────────────────────────────
  if (!invite) {
    return <InviteErrorPage reason="not_found" />;
  }
  if (invite.usedAt !== null) {
    return <InviteErrorPage reason="already_used" />;
  }
  if (invite.expiresAt < now) {
    return <InviteErrorPage reason="expired" />;
  }

  const prefill = (invite.prefillData as Record<string, string>) ?? {};
  const orgName = prefill.orgName ?? "";

  // ── Email capture step (recipientEmail is null) ────────────────────────────
  if (!invite.recipientEmail) {
    const captureWithToken = captureInviteEmail.bind(null, token);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              LA 2028 Media Accreditation
            </div>
            <p className="text-sm text-gray-500">
              You have been invited to submit an Expression of Interest
              {orgName ? ` on behalf of ${orgName}` : ""}.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Enter your email to continue
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Your email is used to authenticate your application. You will not
              receive any emails during the prototype phase.
            </p>

            {error === "invalid_email" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                Please enter a valid email address.
              </div>
            )}

            <form action={captureWithToken} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  autoFocus
                  placeholder="you@organisation.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-blue text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
              >
                Continue to Application
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Ready to redeem — show confirmation and proceed ────────────────────────
  const redeemWithToken = redeemInvite.bind(null, token);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            LA 2028 Media Accreditation
          </div>
          <p className="text-sm text-gray-500">
            You have been invited to submit an Expression of Interest
            {orgName ? ` on behalf of ${orgName}` : ""}.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Continuing as{" "}
              <span className="font-medium text-gray-900">
                {invite.recipientEmail}
              </span>
            </p>
            {orgName && (
              <p className="text-sm text-gray-600 mt-1">
                Organisation:{" "}
                <span className="font-medium text-gray-900">{orgName}</span>
              </p>
            )}
          </div>

          {error === "already_used" && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              This invite link has already been used.
            </div>
          )}

          <form action={redeemWithToken}>
            <button
              type="submit"
              className="w-full bg-brand-blue text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
            >
              Open Pre-Filled Application
            </button>
          </form>

          <p className="mt-3 text-xs text-gray-400 text-center">
            This link expires{" "}
            {invite.expiresAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            and can only be used once.
          </p>
        </div>
      </div>
    </div>
  );
}

function InviteErrorPage({ reason }: { reason: "not_found" | "expired" | "already_used" }) {
  const messages: Record<typeof reason, { title: string; body: string }> = {
    not_found: {
      title: "Invite link not found",
      body: "This invite link is invalid. Check the URL or contact your NOC admin for a new link.",
    },
    expired: {
      title: "Invite link expired",
      body: "This invite link has expired. Contact your NOC admin for a new link.",
    },
    already_used: {
      title: "Invite link already used",
      body: "This invite link has already been used. Each link can only be used once. Contact your NOC admin if you need another link.",
    },
  };

  const { title, body } = messages[reason];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-500">{body}</p>
        </div>
      </div>
    </div>
  );
}
