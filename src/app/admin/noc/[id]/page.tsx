import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, auditLog } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { categoryDisplayLabel } from "@/lib/category";
import {
  approveApplication,
  returnApplication,
  rejectApplication,
} from "../actions";

const STATUS_BADGE: Record<string, string> = {
  pending:     "bg-yellow-100 text-yellow-800",
  resubmitted: "bg-blue-100 text-blue-800",
  approved:    "bg-green-100 text-green-800",
  returned:    "bg-orange-100 text-orange-800",
  rejected:    "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  pending:     "Pending",
  resubmitted: "Resubmitted",
  approved:    "Approved",
  returned:    "Returned",
  rejected:    "Rejected",
};

const ORG_TYPE_LABEL: Record<string, string> = {
  media_print_online: "Print / Online Media",
  media_broadcast:    "Broadcast",
  news_agency:        "News Agency",
  enr:                "ENR (Non-Rights Broadcaster)",
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

  const isActionable = app.status === "pending" || app.status === "resubmitted";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back + header */}
      <div className="mb-6">
        <Link
          href="/admin/noc"
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
          <span
            className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[app.status]}`}
          >
            {STATUS_LABEL[app.status]}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {/* Return/rejection note (if present) */}
        {app.reviewNote && (app.status === "returned" || app.status === "rejected") && (
          <div className={`p-4 rounded-lg border text-sm ${app.status === "rejected" ? "bg-red-50 border-red-200 text-red-800" : "bg-orange-50 border-orange-200 text-orange-800"}`}>
            <div className="font-semibold mb-1">
              {app.status === "rejected" ? "Rejection reason" : "Returned — corrections required"}
            </div>
            <p>{app.reviewNote}</p>
          </div>
        )}

        {/* Organization */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Organization
          </h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{org.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="text-gray-900">{ORG_TYPE_LABEL[org.orgType] ?? org.orgType}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Country</dt>
              <dd className="text-gray-900">{org.country}</dd>
            </div>
            <div>
              <dt className="text-gray-500">NOC</dt>
              <dd className="text-gray-900">{org.nocCode}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email domain</dt>
              <dd className="text-gray-900 font-mono text-xs">{org.emailDomain}</dd>
            </div>
            {org.website && (
              <div>
                <dt className="text-gray-500">Website</dt>
                <dd>
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-[#0057A8] hover:underline text-xs">
                    {org.website}
                  </a>
                </dd>
              </div>
            )}
            {/* isMultiTerritoryFlag intentionally not shown — CRIT-04 / Open Question #16 */}
          </dl>
        </section>

        {/* Contact & application */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Application
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-6">
              <div>
                <dt className="text-gray-500">Contact name</dt>
                <dd className="font-medium text-gray-900">{app.contactName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Contact email</dt>
                <dd className="text-gray-900">{app.contactEmail}</dd>
              </div>
            </div>
            <div>
              <dt className="text-gray-500">Category</dt>
              <dd className="text-gray-900">
                {categoryDisplayLabel(app.categoryPress, app.categoryPhoto)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">About</dt>
              <dd className="text-gray-900 bg-gray-50 rounded p-3 leading-relaxed">
                {app.about}
              </dd>
            </div>
            {app.resubmissionCount > 0 && (
              <div>
                <dt className="text-gray-500">Resubmissions</dt>
                <dd className="text-gray-900">{app.resubmissionCount}</dd>
              </div>
            )}
          </dl>
        </section>

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
            {error === "note_required" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                A note is required when returning or rejecting an application.
              </div>
            )}

            {/* Approve */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Approve</h3>
              <p className="text-xs text-gray-500 mb-3">
                Marks the application as approved and forwards it to the IOC queue.
              </p>
              <form action={approveApplication}>
                <input type="hidden" name="id" value={app.id} />
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors cursor-pointer"
                >
                  Approve Application
                </button>
              </form>
            </div>

            {/* Return */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Return for Corrections
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Send the application back to the applicant with a note explaining what
                needs to be corrected.
              </p>
              <form action={returnApplication} className="space-y-3">
                <input type="hidden" name="id" value={app.id} />
                <textarea
                  name="note"
                  required
                  rows={3}
                  placeholder="Explain what the applicant needs to correct or clarify…"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded hover:bg-orange-600 transition-colors cursor-pointer"
                >
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
                <textarea
                  name="note"
                  required
                  rows={3}
                  placeholder="Provide the reason for rejection…"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Reject Application
                </button>
              </form>
            </div>
          </section>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded text-sm text-gray-500 text-center">
            This application has been {STATUS_LABEL[app.status]?.toLowerCase()} and is no longer editable.
          </div>
        )}
      </div>
    </div>
  );
}
