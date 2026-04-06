import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, auditLog, nocQuotas, orgSlotAllocations } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { categoryDisplayLabel } from "@/lib/category";
import { sumAllocations } from "@/lib/quota-calc";
import { StatusBadge, STATUS_LABEL } from "@/components/StatusBadge";
import {
  approveApplication,
  returnApplication,
  rejectApplication,
  unApproveApplication,
  unReturnApplication,
} from "../actions";

const ORG_TYPE_LABEL: Record<string, string> = {
  media_print_online: "Print / Online Media",
  media_broadcast:    "Broadcast",
  news_agency:        "News Agency",
  enr:                "ENR (Non-Rights Broadcaster)",
};

const PUB_TYPE_LABEL: Record<string, string> = {
  app: "App",
  editorial_website___blog: "Website / Blog",
  email_newsletter: "Email Newsletter",
  magazine___newspaper: "Magazine / Newspaper",
  official_ngb_publication: "NGB Publication",
  photo_journal___online_gallery: "Photo Gallery",
  podcast: "Podcast",
  print_newsletter: "Print Newsletter",
  social_media: "Social Media",
  freelancer_with_confirmed_assignment: "Freelancer",
  other: "Other",
};

const AUDIT_ACTION_LABEL: Record<string, string> = {
  application_submitted:   "Application submitted",
  application_resubmitted: "Application resubmitted",
  application_approved:    "Approved",
  application_returned:    "Returned for corrections",
  application_rejected:    "Rejected",
  email_verified:          "Email verified",
  admin_login:             "Admin signed in",
};

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <dt className="text-gray-500 text-xs">{label}</dt>
      <dd className="text-gray-900 mt-0.5">{value}</dd>
    </div>
  );
}

function QuotaBar({ label, requested, allocated, total }: {
  label: string; requested: number; allocated: number; total: number;
}) {
  const afterApproval = allocated + requested;
  const pctAllocated = Math.min((allocated / total) * 100, 100);
  const pctRequest   = Math.min((requested / total) * 100, Math.max(0, 100 - pctAllocated));
  const overQuota    = afterApproval > total;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 font-mono text-gray-600">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden flex">
        <div className="h-full bg-blue-400 transition-all" style={{ width: `${pctAllocated}%` }} />
        <div className={`h-full transition-all ${overQuota ? "bg-red-400" : "bg-amber-300"}`} style={{ width: `${pctRequest}%` }} />
      </div>
      <span className={`tabular-nums ${overQuota ? "text-red-600 font-semibold" : "text-gray-600"}`}>
        {allocated}+{requested}/{total}
      </span>
      {overQuota && <span className="text-red-600 font-semibold">over quota</span>}
    </div>
  );
}

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireNocSession();
  const { id } = await params;
  const { error } = await searchParams;

  const [row] = await db
    .select({ app: applications, org: organizations })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(
      and(eq(applications.id, id), eq(applications.nocCode, session.nocCode))
    );

  if (!row) notFound();

  const { app, org } = row;

  const logs = await db
    .select()
    .from(auditLog)
    .where(eq(auditLog.applicationId, id))
    .orderBy(asc(auditLog.createdAt));

  // Get this NOC's quota
  const [quota] = await db
    .select()
    .from(nocQuotas)
    .where(and(eq(nocQuotas.nocCode, session.nocCode), eq(nocQuotas.eventId, "LA28")));

  // Get already-approved allocation totals for this NOC (all approved orgs, all slots)
  const existingAllocs = await db
    .select({
      eSlots:   orgSlotAllocations.eSlots,
      esSlots:  orgSlotAllocations.esSlots,
      epSlots:  orgSlotAllocations.epSlots,
      epsSlots: orgSlotAllocations.epsSlots,
      etSlots:  orgSlotAllocations.etSlots,
      ecSlots:  orgSlotAllocations.ecSlots,
    })
    .from(orgSlotAllocations)
    .where(and(
      eq(orgSlotAllocations.nocCode, session.nocCode),
      eq(orgSlotAllocations.eventId, "LA28")
    ));

  const allocated = sumAllocations(existingAllocs);

  const isActionable = app.status === "pending" || app.status === "resubmitted";

  const pubTypes = (app.publicationTypes as string[] | null) ?? [];
  const hasAddress = org.address || org.city || org.stateProvince || org.postalCode;
  const hasSecondary = app.secondaryFirstName || app.secondaryLastName;
  const hasPublication = pubTypes.length > 0 || app.circulation || app.publicationFrequency || app.sportsToCover;
  const hasHistory = app.priorOlympic !== null || app.priorParalympic !== null || app.pastCoverageExamples;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back + header */}
      <div className="mb-6">
        <Link
          href="/admin/noc/queue"
          className="text-xs text-gray-500 hover:text-gray-700 mb-3 inline-block"
        >
          ← Back to queue
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-mono">
              {app.referenceNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{org.name}</p>
          </div>
          <span className="shrink-0">
            <StatusBadge status={app.status} />
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {/* Return/rejection note */}
        {app.reviewNote && (app.status === "returned" || app.status === "rejected") && (
          <div className={`p-4 rounded-lg border text-sm ${app.status === "rejected" ? "bg-red-50 border-red-200 text-red-800" : "bg-orange-50 border-orange-200 text-orange-800"}`}>
            <div className="font-semibold mb-1">
              {app.status === "rejected" ? "Rejection reason" : "Returned — corrections required"}
            </div>
            <p>{app.reviewNote}</p>
          </div>
        )}

        {/* Organisation */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Organisation
          </h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Name" value={org.name} />
            <Field label="Type" value={ORG_TYPE_LABEL[org.orgType] ?? org.orgType} />
            <Field label="Country" value={org.country} />
            <Field label="NOC" value={org.nocCode} />
            <Field label="Email domain" value={org.emailDomain} />
            {org.website && (
              <div>
                <dt className="text-gray-500 text-xs">Website</dt>
                <dd>
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-[#0057A8] hover:underline text-xs">
                    {org.website}
                  </a>
                </dd>
              </div>
            )}
            {org.isFreelancer && <Field label="Freelancer" value="Yes" />}
            {app.accessibilityNeeds && <Field label="Accessibility needs" value="Yes — wheelchair access required" />}
          </dl>
          {hasAddress && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
              <dt className="text-gray-500 text-xs mb-1">Address</dt>
              <dd className="text-gray-900">
                {[org.address, org.address2, [org.city, org.stateProvince, org.postalCode].filter(Boolean).join(", ")].filter(Boolean).join(", ")}
              </dd>
            </div>
          )}
        </section>

        {/* Contacts */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Contacts
          </h2>
          <dl className="text-sm space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Field label="Name" value={app.contactFirstName && app.contactLastName ? `${app.contactFirstName} ${app.contactLastName}` : app.contactName} />
              <Field label="Email" value={app.contactEmail} />
              <Field label="Position" value={app.contactTitle} />
              <Field label="Office phone" value={app.contactPhone} />
              <Field label="Cell phone" value={app.contactCell} />
            </div>
            {hasSecondary && (
              <div className="pt-3 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-500 mb-2">Secondary contact</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Field label="Name" value={[app.secondaryFirstName, app.secondaryLastName].filter(Boolean).join(" ")} />
                  <Field label="Email" value={app.secondaryEmail} />
                  <Field label="Position" value={app.secondaryTitle} />
                  <Field label="Office phone" value={app.secondaryPhone} />
                  <Field label="Cell phone" value={app.secondaryCell} />
                </div>
              </div>
            )}
          </dl>
        </section>

        {/* Accreditation */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Accreditation Request
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-6">
              <div>
                <dt className="text-gray-500 text-xs">Category</dt>
                <dd className="text-gray-900 mt-0.5">{categoryDisplayLabel(app.categoryE, app.categoryEs, app.categoryEp, app.categoryEps, app.categoryEt, app.categoryEc)}</dd>
              </div>
              {(app.requestedE || app.requestedEs || app.requestedEp || app.requestedEps || app.requestedEt || app.requestedEc) && (
                <div>
                  <dt className="text-gray-500 text-xs">Requested</dt>
                  <dd className="text-gray-900 mt-0.5">
                    {[
                      app.requestedE   ? `${app.requestedE} E`   : null,
                      app.requestedEs  ? `${app.requestedEs} Es`  : null,
                      app.requestedEp  ? `${app.requestedEp} EP`  : null,
                      app.requestedEps ? `${app.requestedEps} EPs` : null,
                      app.requestedEt  ? `${app.requestedEt} ET`  : null,
                      app.requestedEc  ? `${app.requestedEc} EC`  : null,
                    ].filter(Boolean).join(", ")}
                  </dd>
                </div>
              )}
            </div>
            {quota && isActionable && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-900 mb-2">Quota impact if approved</p>
                <div className="space-y-1.5">
                  {app.categoryE && quota.eTotal > 0 && (
                    <QuotaBar label="E" requested={app.requestedE ?? 0} allocated={allocated.E} total={quota.eTotal} />
                  )}
                  {app.categoryEs && quota.esTotal > 0 && (
                    <QuotaBar label="Es" requested={app.requestedEs ?? 0} allocated={allocated.Es} total={quota.esTotal} />
                  )}
                  {app.categoryEp && quota.epTotal > 0 && (
                    <QuotaBar label="EP" requested={app.requestedEp ?? 0} allocated={allocated.EP} total={quota.epTotal} />
                  )}
                  {app.categoryEps && quota.epsTotal > 0 && (
                    <QuotaBar label="EPs" requested={app.requestedEps ?? 0} allocated={allocated.EPs} total={quota.epsTotal} />
                  )}
                  {app.categoryEt && quota.etTotal > 0 && (
                    <QuotaBar label="ET" requested={app.requestedEt ?? 0} allocated={allocated.ET} total={quota.etTotal} />
                  )}
                  {app.categoryEc && quota.ecTotal > 0 && (
                    <QuotaBar label="EC" requested={app.requestedEc ?? 0} allocated={allocated.EC} total={quota.ecTotal} />
                  )}
                </div>
              </div>
            )}
            <div>
              <dt className="text-gray-500 text-xs mb-1">About coverage</dt>
              <dd className="text-gray-900 bg-gray-50 rounded p-3 leading-relaxed">{app.about}</dd>
            </div>
            {app.resubmissionCount > 0 && <Field label="Resubmissions" value={app.resubmissionCount} />}
          </dl>
        </section>

        {/* Publication details (if any filled) */}
        {hasPublication && (
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Publication Details
            </h2>
            <dl className="space-y-3 text-sm">
              {pubTypes.length > 0 && (
                <div>
                  <dt className="text-gray-500 text-xs mb-1">Publication type</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {pubTypes.map((t) => (
                      <span key={t} className="inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        {PUB_TYPE_LABEL[t] ?? t}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-6">
                <Field label="Circulation / visitors" value={app.circulation} />
                <Field label="Publication frequency" value={app.publicationFrequency} />
              </div>
              {app.sportsToCover && (
                <div>
                  <dt className="text-gray-500 text-xs mb-1">Sports to cover</dt>
                  <dd className="text-gray-900">{app.sportsToCover}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {/* Accreditation history (if any filled) */}
        {hasHistory && (
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Accreditation History
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-x-6">
                {app.priorOlympic !== null && (
                  <div>
                    <dt className="text-gray-500 text-xs">Prior Olympic accreditation</dt>
                    <dd className="mt-0.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${app.priorOlympic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {app.priorOlympic ? "Yes" : "No"}
                      </span>
                    </dd>
                  </div>
                )}
                {app.priorParalympic !== null && (
                  <div>
                    <dt className="text-gray-500 text-xs">Prior Paralympic accreditation</dt>
                    <dd className="mt-0.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${app.priorParalympic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {app.priorParalympic ? "Yes" : "No"}
                      </span>
                    </dd>
                  </div>
                )}
              </div>
              <Field label="Olympic years" value={app.priorOlympicYears} />
              <Field label="Paralympic years" value={app.priorParalympicYears} />
              {app.pastCoverageExamples && (
                <div>
                  <dt className="text-gray-500 text-xs mb-1">Past coverage / sporting events</dt>
                  <dd className="text-gray-900 bg-gray-50 rounded p-3 leading-relaxed whitespace-pre-line">{app.pastCoverageExamples}</dd>
                </div>
              )}
              {app.additionalComments && (
                <div>
                  <dt className="text-gray-500 text-xs mb-1">Additional comments</dt>
                  <dd className="text-gray-900 bg-gray-50 rounded p-3 leading-relaxed">{app.additionalComments}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {/* Internal note (NOC-only) */}
        {app.internalNote && (
          <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 text-sm">
            <div className="font-semibold text-yellow-800 mb-1">Internal note (NOC only)</div>
            <p className="text-yellow-900">{app.internalNote}</p>
          </div>
        )}

        {/* Audit trail */}
        {logs.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              History
            </h2>
            <ol className="space-y-3">
              {logs.map((log) => (
                <li key={log.id} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">
                      {AUDIT_ACTION_LABEL[log.action] ?? log.action}
                    </span>
                    {log.actorLabel && (
                      <span className="text-gray-500"> · {log.actorLabel}</span>
                    )}
                    <div className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                    {log.detail && (
                      <p className="text-xs text-gray-600 mt-0.5 italic">
                        &ldquo;{log.detail}&rdquo;
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Review actions */}
        {isActionable ? (
          <section className="space-y-3">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              <strong>Approving this application</strong> confirms the organisation is eligible to apply — it does not commit any accreditation slots. Slot quantities are negotiated in the Press by Number (PbN) phase after all applications are reviewed.
            </div>

            {error === "note_required" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                A note is required when returning or rejecting an application.
              </div>
            )}

            {error === "stale" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                This application was modified by another user. Please review the current state and try again.
              </div>
            )}

            {/* Approve */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Approve as Candidate</h3>
              <p className="text-xs text-gray-500 mb-3">
                Marks this organisation as a <strong>candidate</strong> for press accreditation. Approval at this stage does not guarantee credentials — slot allocation happens separately in Press by Number, subject to your IOC quota. An approved org may ultimately receive zero slots.
              </p>
              <form action={approveApplication} className="space-y-3">
                <input type="hidden" name="id" value={app.id} />
                <textarea
                  name="internal_note"
                  rows={2}
                  placeholder="Internal note (optional, NOC only — not visible to applicant)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors cursor-pointer"
                >
                  Approve as Candidate
                </button>
              </form>
            </div>

            {/* Return */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Return for Corrections</h3>
              <p className="text-xs text-gray-500 mb-3">
                Send the application back to the applicant with a note explaining what needs to be corrected.
              </p>
              <form action={returnApplication} className="space-y-3">
                <input type="hidden" name="id" value={app.id} />
                <textarea name="note" required rows={3}
                  placeholder="Explain what the applicant needs to correct or clarify..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none" />
                <button type="submit"
                  className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded hover:bg-orange-600 transition-colors cursor-pointer">
                  Return for Corrections
                </button>
              </form>
            </div>

            {/* Reject */}
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-5">
              <h3 className="text-sm font-semibold text-red-700 mb-1">Reject</h3>
              <p className="text-xs text-gray-500 mb-3">
                Permanently reject this application. This action cannot be undone.
              </p>
              <form action={rejectApplication} className="space-y-3">
                <input type="hidden" name="id" value={app.id} />
                <textarea name="note" required rows={3}
                  placeholder="Provide the reason for rejection..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none" />
                <button type="submit"
                  className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors cursor-pointer">
                  Reject Application
                </button>
              </form>
            </div>
          </section>
        ) : app.status === "approved" ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Un-approve</h3>
            <p className="text-xs text-gray-500 mb-3">
              Move this application back to Pending if you need to revise your decision.
            </p>
            <form action={unApproveApplication} className="space-y-3">
              <input type="hidden" name="id" value={app.id} />
              <input
                name="reason" type="text" placeholder="Reason (optional)"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button type="submit"
                className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded hover:bg-yellow-600 transition-colors cursor-pointer">
                Un-approve
              </button>
            </form>
          </div>
        ) : app.status === "returned" ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Cancel Return</h3>
            <p className="text-xs text-gray-500 mb-3">
              Move this application back to Pending if you returned it in error.
            </p>
            <form action={unReturnApplication}>
              <input type="hidden" name="id" value={app.id} />
              <button type="submit"
                className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded hover:bg-yellow-600 transition-colors cursor-pointer">
                Cancel Return
              </button>
            </form>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded text-sm text-gray-500 text-center">
            This application has been {STATUS_LABEL[app.status]?.toLowerCase()} and is no longer editable.
          </div>
        )}
      </div>
    </div>
  );
}
