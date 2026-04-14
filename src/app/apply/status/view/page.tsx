import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { magicLinkTokens, applications, orgSlotAllocations, organizations } from "@/db/schema";
import { hashToken } from "@/lib/tokens";
import { STATUS_BADGE } from "@/components/StatusBadge";

// Applicant-facing labels differ slightly from admin labels
const STATUS_LABEL: Record<string, string> = {
  pending:     "Pending Review",
  resubmitted: "Resubmitted",
  approved:    "Accepted as Candidate",
  returned:    "Returned for Corrections",
  rejected:    "Rejected",
};

const STATUS_DESC: Record<string, string> = {
  pending:     "Your application is awaiting review by your NOC.",
  resubmitted: "Your corrected application is under review.",
  approved:    "Your NOC has accepted your application as a candidate for press accreditation. Accreditation slot allocation happens in the next phase (Press by Number) and is not guaranteed — some accepted candidates may ultimately receive no slots. You will be notified once the NOC's allocation is finalised.",
  returned:    "Your NOC has requested corrections. Please review the note below and resubmit.",
  rejected:    "Your application has not been accepted.",
};

export default async function StatusViewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) redirect("/apply/status");

  const tokenHash = hashToken(token);
  const [tokenRecord] = await db
    .select()
    .from(magicLinkTokens)
    .where(and(eq(magicLinkTokens.tokenHash, tokenHash), eq(magicLinkTokens.email, email)));

  if (!tokenRecord || tokenRecord.usedAt !== null || tokenRecord.expiresAt < new Date()) {
    redirect("/apply?error=invalid_token");
  }

  // Look up applications for this email
  const rows = await db
    .select({
      app: applications,
      orgName: organizations.name,
      allocation: orgSlotAllocations,
    })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .leftJoin(
      orgSlotAllocations,
      and(
        eq(orgSlotAllocations.organizationId, applications.organizationId),
        eq(orgSlotAllocations.nocCode, applications.nocCode)
      )
    )
    .where(eq(applications.contactEmail, email));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Application Status</h1>
      <p className="text-gray-500 mb-6 text-sm">Logged in as {email}</p>

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-500">
          <div className="font-medium text-gray-700 mb-1">No applications found</div>
          <p className="text-gray-500">We couldn&apos;t find an application for <span className="font-medium">{email}</span>.</p>
          <p className="mt-2 text-gray-400">If you applied with a different address, <a href="/apply/status" className="text-[#0057A8] hover:underline">try again</a>. Otherwise contact your NOC directly.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(({ app, orgName, allocation }) => (
            <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-mono text-xs text-gray-400 mb-1">{app.referenceNumber}</div>
                  <div className="font-semibold text-gray-900">{orgName}</div>
                </div>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[app.status]}`}>
                  {STATUS_LABEL[app.status] ?? app.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">{STATUS_DESC[app.status]}</p>

              {app.status === "returned" && app.reviewNote && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                  <div className="font-medium mb-1">NOC note:</div>
                  {app.reviewNote}
                </div>
              )}

              {app.status === "approved" && !allocation && (
                <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                  <div className="font-medium text-gray-700 mb-1">Slot allocation in progress</div>
                  Your accreditation numbers are being finalised. You will be contacted once slot allocation is confirmed.
                </div>
              )}

              {app.status === "approved" && allocation && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="text-xs font-medium text-green-800 mb-2">Allocated slots</div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-green-900">
                    {[
                      { label: "E (Journalist)", val: allocation.eSlots },
                      { label: "Es (Sport Journalist)", val: allocation.esSlots },
                      { label: "EP (Photographer)", val: allocation.epSlots },
                      { label: "EPs (Sport Photo)", val: allocation.epsSlots },
                      { label: "ET (Technician)", val: allocation.etSlots },
                      { label: "EC (Support)", val: allocation.ecSlots },
                    ]
                      .filter(({ val }) => (val ?? 0) > 0)
                      .map(({ label, val }) => (
                        <div key={label}>
                          <div className="text-green-600">{label}</div>
                          <div className="font-semibold text-lg">{val}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {app.status === "returned" && (
                <Link
                  href={`/apply/form?token=${token}&email=${encodeURIComponent(email)}&resubmit=${app.id}`}
                  className="inline-block mt-1 px-4 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors"
                >
                  Correct &amp; Resubmit
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-400 text-center">
        Questions about your application? Contact your NOC directly.
      </p>
    </div>
  );
}
