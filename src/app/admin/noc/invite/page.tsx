import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { invitations } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { COUNTRY_CODES } from "@/lib/codes";
import { InviteForm } from "./InviteForm";

function inviteStatus(invite: {
  usedAt: Date | null;
  expiresAt: Date;
}): "accepted" | "expired" | "pending" {
  if (invite.usedAt !== null) return "accepted";
  if (invite.expiresAt < new Date()) return "expired";
  return "pending";
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  accepted: { label: "Accepted",  className: "bg-green-100 text-green-800" },
  expired:  { label: "Expired",   className: "bg-gray-100 text-gray-600" },
  pending:  { label: "Pending",   className: "bg-yellow-100 text-yellow-800" },
};

export default async function InvitePage() {
  const session = await requireNocSession();

  const rows = await db
    .select()
    .from(invitations)
    .where(eq(invitations.nocCode, session.nocCode))
    .orderBy(desc(invitations.createdAt))
    .limit(50);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Invite Organisation — {session.nocCode}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Create a pre-addressed invite link that pre-fills the EoI form for a
          known organisation. The link can be sent via email or shared directly.
        </p>
      </div>

      <div className="mb-8">
        <InviteForm countryCodes={COUNTRY_CODES} />
      </div>

      {/* Sent invitations list */}
      {rows.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Sent Invitations
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Org
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Recipient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Expires
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const prefill = (row.prefillData as Record<string, string>) ?? {};
                  const status = inviteStatus(row);
                  const badge = STATUS_BADGE[status];
                  return (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>{prefill.orgName ?? <span className="text-gray-400 italic">—</span>}</div>
                        <div className="text-xs text-gray-400 font-mono">
                          {row.id.slice(0, 8)}…
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.recipientEmail ?? <span className="italic text-gray-400">not set</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {row.createdAt.toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {row.expiresAt.toLocaleDateString("en-GB")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
