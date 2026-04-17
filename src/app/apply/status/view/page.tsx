import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { magicLinkTokens, applications, orgSlotAllocations, organizations, featureFlags } from "@/db/schema";
import { hashToken } from "@/lib/tokens";
import { STATUS_BADGE } from "@/components/StatusBadge";

async function isPbnResultsPublished(): Promise<boolean> {
  const [flag] = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.name, "pbn_results_published"));
  return flag?.state === "on";
}

/** Map a raw application status to what the applicant should see.
 *  When PbN results are not yet published, anything except "returned"
 *  is masked as "pending" (shown as "Application Under Review").
 */
function maskStatus(rawStatus: string, pbnPublished: boolean): string {
  if (pbnPublished) return rawStatus;
  if (rawStatus === "returned") return "returned";
  return "pending";
}

const STATUS_LABEL: Record<string, string> = {
  pending:     "Application Under Review",
  resubmitted: "Application Under Review",
  approved:    "Accepted as Candidate",
  returned:    "Returned for Corrections",
  rejected:    "Rejected",
};

const STATUS_DESC: Record<string, string> = {
  pending:     "Your application has been received and is under review.",
  resubmitted: "Your corrected application is under review.",
  approved:    "Your NOC has accepted your application as a candidate for press accreditation. Accreditation slot allocation happens in the next phase (Press by Number) and is not guaranteed — some accepted candidates may ultimately receive no slots. You will be notified once the NOC's allocation is finalised.",
  returned:    "Your NOC has requested corrections. Please review the note below and resubmit.",
  rejected:    "Your application has not been accepted.",
};

const ORG_TYPE_LABEL: Record<string, string> = {
  media_print_online: "Print / Online Media",
  media_broadcast:    "Broadcast",
  news_agency:        "News Agency",
};

const CATEGORY_LABEL: Record<string, string> = {
  E: "E — Journalist", Es: "Es — Sport Journalist",
  EP: "EP — Photographer", EPs: "EPs — Sport Photographer",
  ET: "ET — Technical", EC: "EC — Support",
};

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-x-3 text-sm py-1">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 break-words">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</div>
      {children}
    </div>
  );
}

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

  const pbnPublished = await isPbnResultsPublished();

  const rows = await db
    .select({
      app: applications,
      org: organizations,
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
          {rows.map(({ app, org, allocation }) => {
            const displayStatus = maskStatus(app.status, pbnPublished);
            const categories = (
              [
                ["E",   app.categoryE,   app.requestedE],
                ["Es",  app.categoryEs,  app.requestedEs],
                ["EP",  app.categoryEp,  app.requestedEp],
                ["EPs", app.categoryEps, app.requestedEps],
                ["ET",  app.categoryEt,  app.requestedEt],
                ["EC",  app.categoryEc,  app.requestedEc],
              ] as [string, boolean | null, number | null][]
            ).filter(([, checked]) => checked);

            const orgAddress = [org.address, org.address2, org.city, org.stateProvince, org.postalCode]
              .filter(Boolean).join(", ");

            return (
              <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-xs text-gray-400 mb-1">{app.referenceNumber}</div>
                    <div className="font-semibold text-gray-900">{org.name}</div>
                  </div>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[displayStatus]}`}>
                    {STATUS_LABEL[displayStatus] ?? displayStatus}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{STATUS_DESC[displayStatus]}</p>

                {displayStatus === "returned" && app.reviewNote && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                    <div className="font-medium mb-1">NOC note:</div>
                    {app.reviewNote}
                  </div>
                )}

                {displayStatus === "approved" && !allocation && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                    <div className="font-medium text-gray-700 mb-1">Slot allocation in progress</div>
                    Your accreditation numbers are being finalised. You will be contacted once slot allocation is confirmed.
                  </div>
                )}

                {displayStatus === "approved" && allocation && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
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

                {/* Action buttons */}
                <div className="flex items-center gap-3 mb-4">
                  {displayStatus === "pending" && app.status === "pending" && (
                    <Link
                      href={`/apply/form?token=${token}&email=${encodeURIComponent(email)}&resubmit=${app.id}`}
                      className="inline-block px-4 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors"
                    >
                      Edit application
                    </Link>
                  )}
                  {displayStatus === "returned" && (
                    <Link
                      href={`/apply/form?token=${token}&email=${encodeURIComponent(email)}&resubmit=${app.id}`}
                      className="inline-block px-4 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors"
                    >
                      Correct &amp; Resubmit
                    </Link>
                  )}
                </div>

                {/* Collapsible read-only application view */}
                <details className="border border-gray-200 rounded-lg overflow-hidden">
                  <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-50 bg-gray-50">
                    View submitted application
                  </summary>
                  <div className="px-4 py-4 border-t border-gray-100 divide-y divide-gray-100">

                    <Section title="Organisation">
                      <Row label="Name" value={org.name} />
                      <Row label="Type" value={ORG_TYPE_LABEL[org.orgType] ?? org.orgType} />
                      <Row label="Country" value={org.country} />
                      <Row label="NOC" value={app.nocCode} />
                      <Row label="Website" value={org.website} />
                      <Row label="Address" value={orgAddress || null} />
                    </Section>

                    <div className="pt-4">
                      <Section title="Primary Contact">
                        <Row label="Name" value={[app.contactFirstName, app.contactLastName].filter(Boolean).join(" ")} />
                        <Row label="Title" value={app.contactTitle} />
                        <Row label="Email" value={app.contactEmail} />
                        <Row label="Phone" value={app.contactPhone} />
                        <Row label="Mobile" value={app.contactCell} />
                      </Section>
                    </div>

                    {(app.secondaryFirstName || app.secondaryLastName) && (
                      <div className="pt-4">
                        <Section title="Secondary Contact">
                          <Row label="Name" value={[app.secondaryFirstName, app.secondaryLastName].filter(Boolean).join(" ")} />
                          <Row label="Title" value={app.secondaryTitle} />
                          <Row label="Email" value={app.secondaryEmail} />
                          <Row label="Phone" value={app.secondaryPhone} />
                          <Row label="Mobile" value={app.secondaryCell} />
                        </Section>
                      </div>
                    )}

                    <div className="pt-4">
                      <Section title="Accreditation">
                        {categories.length > 0 && (
                          <div className="grid grid-cols-[140px_1fr] gap-x-3 text-sm py-1">
                            <span className="text-gray-500 shrink-0">Categories</span>
                            <div className="space-y-0.5">
                              {categories.map(([cat, , qty]) => (
                                <div key={cat} className="text-gray-900">
                                  {CATEGORY_LABEL[cat] ?? cat}{qty != null ? ` — ${qty} requested` : ""}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <Row label="About" value={app.about} />
                      </Section>
                    </div>

                    <div className="pt-4">
                      <Section title="Publication">
                        <Row label="Types" value={Array.isArray(app.publicationTypes) ? (app.publicationTypes as string[]).join(", ") : null} />
                        <Row label="Circulation" value={app.circulation} />
                        <Row label="Frequency" value={app.publicationFrequency} />
                        <Row label="Sports covered" value={app.sportsToCover} />
                      </Section>
                    </div>

                    <div className="pt-4">
                      <Section title="History">
                        <Row label="Prior Olympic" value={app.priorOlympic === true ? "Yes" : app.priorOlympic === false ? "No" : null} />
                        {app.priorOlympic && <Row label="Olympic years" value={app.priorOlympicYears} />}
                        <Row label="Prior Paralympic" value={app.priorParalympic === true ? "Yes" : app.priorParalympic === false ? "No" : null} />
                        {app.priorParalympic && <Row label="Paralympic years" value={app.priorParalympicYears} />}
                        <Row label="Past coverage" value={app.pastCoverageExamples} />
                        <Row label="Comments" value={app.additionalComments} />
                      </Section>
                    </div>

                  </div>
                </details>

              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-400 text-center">
        Questions about your application? Contact your NOC directly.
      </p>
    </div>
  );
}
