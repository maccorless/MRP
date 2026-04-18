"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge, STATUS_LABEL } from "@/components/StatusBadge";
import { categoryDisplayLabel } from "@/lib/category";
import type { CategoryTotals } from "@/lib/quota-calc";
import {
  approveApplication,
  returnApplication,
  rejectApplication,
  unApproveApplication,
  unReturnApplication,
  reverseRejection,
} from "../actions";

const ORG_TYPE_LABEL: Record<string, string> = {
  media_print_online: "Print / Online Media",
  media_broadcast:    "Broadcast",
  news_agency:        "News Agency",
  freelancer:         "Freelancer / Independent",
  enr:                "ENR (Non-Rights Broadcaster)",
  ino:                "INO (Intl Non-Gov Organisation)",
  if_staff:           "IF Staff",
  other:              "Other",
};

const GEO_COVERAGE_LABEL: Record<string, string> = {
  international: "International",
  national: "National",
  local: "Local / Regional",
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
  application_submitted: "Application submitted",
  application_resubmitted: "Application resubmitted",
  application_approved: "Accepted as Candidate",
  application_returned: "Returned for corrections",
  application_rejected: "Rejected",
  application_unapproved: "Approval reversed",
  application_unreturned: "Return cancelled",
  rejection_reversed: "Rejection reversed",
  email_verified: "Email verified",
  admin_login: "Admin signed in",
};

type AppDetail = {
  // We type the server response loosely — the drawer only reads fields that
  // exist on the applications/organizations tables.
  app: Record<string, unknown> & {
    id: string;
    referenceNumber: string;
    status: "pending" | "resubmitted" | "approved" | "returned" | "rejected";
    organizationId: string;
  };
  org: Record<string, unknown> & {
    name: string;
    orgType: string;
    country: string;
    nocCode: string;
  };
  logs: Array<{
    id: string;
    action: string;
    actorLabel: string | null;
    createdAt: string;
    detail: string | null;
  }>;
  quota: {
    eTotal: number;
    esTotal: number;
    epTotal: number;
    epsTotal: number;
    etTotal: number;
    ecTotal: number;
  } | null;
  allocated: CategoryTotals;
};

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <dt className="text-gray-500 text-xs">{label}</dt>
      <dd className="text-gray-900 mt-0.5">{value}</dd>
    </div>
  );
}

function QuotaBar({
  label,
  requested,
  allocated,
  total,
}: {
  label: string;
  requested: number;
  allocated: number;
  total: number;
}) {
  const afterApproval = allocated + requested;
  const pctAllocated = Math.min((allocated / total) * 100, 100);
  const pctRequest = Math.min(
    (requested / total) * 100,
    Math.max(0, 100 - pctAllocated),
  );
  const overQuota = afterApproval > total;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 font-mono text-gray-600">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-blue-400 transition-all"
          style={{ width: `${pctAllocated}%` }}
        />
        <div
          className={`h-full transition-all ${overQuota ? "bg-red-400" : "bg-amber-300"}`}
          style={{ width: `${pctRequest}%` }}
        />
      </div>
      <span
        className={`tabular-nums ${overQuota ? "text-red-600 font-semibold" : "text-gray-600"}`}
      >
        {allocated}+{requested}/{total}
      </span>
      {overQuota && (
        <span className="text-red-600 font-semibold">over quota</span>
      )}
    </div>
  );
}

export function ApplicationDrawer({
  appId,
  allIds,
  onClose,
  onNavigate,
}: {
  appId: string;
  allIds: string[];
  onClose: () => void;
  onNavigate: (newId: string) => void;
}) {
  const [data, setData] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentIndex = allIds.indexOf(appId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allIds.length - 1;

  // Load detail whenever appId changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/api/admin/noc/application/${appId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return (await res.json()) as AppDetail;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [appId]);

  // Escape key closes drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev)
        onNavigate(allIds[currentIndex - 1]);
      if (e.key === "ArrowRight" && hasNext)
        onNavigate(allIds[currentIndex + 1]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNavigate, allIds, currentIndex, hasPrev, hasNext]);

  const app = data?.app;
  const org = data?.org;
  const pubTypes = ((app?.publicationTypes as string[] | null) ?? []) as string[];
  const isActionable =
    app?.status === "pending" || app?.status === "resubmitted";

  const hasAddress = Boolean(
    org && (org.address || org.city || org.stateProvince || org.postalCode),
  );
  const hasSecondary = Boolean(
    app && (app.secondaryFirstName || app.secondaryLastName),
  );
  const hasPublication = Boolean(
    app &&
      (pubTypes.length > 0 ||
        app.circulation ||
        app.publicationFrequency ||
        app.sportsToCover ||
        app.onlineUniqueVisitors ||
        app.geographicalCoverage ||
        app.socialMediaAccounts),
  );
  const hasHistory = Boolean(
    app &&
      (app.priorOlympic !== null ||
        app.priorParalympic !== null ||
        app.pastCoverageExamples),
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <aside
        className="fixed top-0 right-0 z-50 h-full w-full max-w-[640px] bg-white shadow-2xl overflow-y-auto border-l border-gray-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Sticky header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => hasPrev && onNavigate(allIds[currentIndex - 1])}
              disabled={!hasPrev}
              className="px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous application"
            >
              ← Prev
            </button>
            <button
              onClick={() => hasNext && onNavigate(allIds[currentIndex + 1])}
              disabled={!hasNext}
              className="px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next application"
            >
              Next →
            </button>
            <span className="text-gray-400 tabular-nums ml-1">
              {currentIndex >= 0
                ? `${currentIndex + 1} of ${allIds.length}`
                : ""}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {app && (
              <Link
                href={`/admin/noc/${appId}`}
                className="text-xs text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline"
              >
                Open full page ↗
              </Link>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </header>

        <div className="p-5">
          {loading && (
            <div className="py-12 text-center text-sm text-gray-400">
              Loading application…
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Failed to load application: {error}
            </div>
          )}

          {data && app && org && (
            <>
              {/* Application header */}
              <div className="mb-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1
                      id="drawer-title"
                      className="text-lg font-bold text-gray-900 font-mono"
                    >
                      {app.referenceNumber as string}
                    </h1>
                    <p className="text-sm text-gray-700 mt-0.5 font-medium">
                      {org.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {ORG_TYPE_LABEL[org.orgType] ?? org.orgType} · {org.country}
                    </p>
                  </div>
                  <span className="shrink-0">
                    <StatusBadge status={app.status} />
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Return / rejection note */}
                {Boolean(app.reviewNote) &&
                  (app.status === "returned" || app.status === "rejected") && (
                    <div
                      className={`p-3 rounded-lg border text-sm ${app.status === "rejected" ? "bg-red-50 border-red-200 text-red-800" : "bg-orange-50 border-orange-200 text-orange-800"}`}
                    >
                      <div className="font-semibold mb-1">
                        {app.status === "rejected"
                          ? "Rejection reason"
                          : "Returned — corrections required"}
                      </div>
                      <p>{app.reviewNote as string}</p>
                    </div>
                  )}

                {/* Organisation */}
                <section className="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Organisation
                  </h2>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <Field label="Name" value={org.name} />
                    <Field
                      label="Type"
                      value={ORG_TYPE_LABEL[org.orgType] ?? org.orgType}
                    />
                    <Field label="Country" value={org.country} />
                    <Field label="NOC" value={org.nocCode} />
                    <Field
                      label="Email domain"
                      value={org.emailDomain as string | null}
                    />
                    {Boolean(org.website) && (
                      <div>
                        <dt className="text-gray-500 text-xs">Website</dt>
                        <dd>
                          <a
                            href={org.website as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0057A8] hover:underline text-xs"
                          >
                            {org.website as string}
                          </a>
                        </dd>
                      </div>
                    )}
                    {Boolean(org.orgEmail) && (
                      <Field label="Org email" value={org.orgEmail as string} />
                    )}
                    {org.orgType === "other" && Boolean(app.orgTypeOther) && (
                      <Field label="Org type (specified)" value={app.orgTypeOther as string} />
                    )}
                    {Boolean(app.accessibilityNeeds) && (
                      <Field
                        label="Accessibility needs"
                        value="Yes — wheelchair access required"
                      />
                    )}
                  </dl>
                  {org.orgType === "freelancer" && app.pressCard !== null && app.pressCard !== undefined && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                      <dt className="text-gray-500 text-xs mb-1">Press card</dt>
                      <dd className="text-gray-900">
                        {app.pressCard
                          ? `Yes — issued by ${(app.pressCardIssuer as string | null) ?? "unknown"}`
                          : "No"}
                      </dd>
                    </div>
                  )}
                  {hasAddress && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                      <dt className="text-gray-500 text-xs mb-1">Address</dt>
                      <dd className="text-gray-900">
                        {[
                          org.address,
                          org.address2,
                          [org.city, org.stateProvince, org.postalCode]
                            .filter(Boolean)
                            .join(", "),
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </dd>
                    </div>
                  )}
                </section>

                {/* Contacts */}
                <section className="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Contacts
                  </h2>
                  <dl className="text-sm space-y-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <Field
                        label="Name"
                        value={
                          app.contactFirstName && app.contactLastName
                            ? `${app.contactFirstName} ${app.contactLastName}`
                            : (app.contactName as string | null)
                        }
                      />
                      <Field
                        label="Email"
                        value={app.contactEmail as string | null}
                      />
                      <Field
                        label="Position"
                        value={app.contactTitle as string | null}
                      />
                      <Field
                        label="Office phone"
                        value={app.contactPhone as string | null}
                      />
                      <Field
                        label="Cell phone"
                        value={app.contactCell as string | null}
                      />
                    </div>
                    {hasSecondary && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="text-xs font-medium text-gray-500 mb-2">
                          Editor-in-Chief / Media Manager
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <Field
                            label="Name"
                            value={[app.secondaryFirstName, app.secondaryLastName]
                              .filter(Boolean)
                              .join(" ")}
                          />
                          <Field
                            label="Email"
                            value={app.secondaryEmail as string | null}
                          />
                          <Field
                            label="Position"
                            value={app.secondaryTitle as string | null}
                          />
                          <Field
                            label="Office phone"
                            value={app.secondaryPhone as string | null}
                          />
                          <Field
                            label="Cell phone"
                            value={app.secondaryCell as string | null}
                          />
                        </div>
                      </div>
                    )}
                  </dl>
                </section>

                {/* Accreditation */}
                <section className="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Accreditation Request
                  </h2>
                  <dl className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-x-4">
                      <div>
                        <dt className="text-gray-500 text-xs">Category</dt>
                        <dd className="text-gray-900 mt-0.5">
                          {categoryDisplayLabel(
                            app.categoryE as boolean,
                            app.categoryEs as boolean,
                            app.categoryEp as boolean,
                            app.categoryEps as boolean,
                            app.categoryEt as boolean,
                            app.categoryEc as boolean,
                          )}
                        </dd>
                      </div>
                      {Boolean(
                        app.requestedE ||
                          app.requestedEs ||
                          app.requestedEp ||
                          app.requestedEps ||
                          app.requestedEt ||
                          app.requestedEc,
                      ) && (
                        <div>
                          <dt className="text-gray-500 text-xs">Requested</dt>
                          <dd className="text-gray-900 mt-0.5">
                            {[
                              app.requestedE ? `${app.requestedE} E` : null,
                              app.requestedEs ? `${app.requestedEs} Es` : null,
                              app.requestedEp ? `${app.requestedEp} EP` : null,
                              app.requestedEps
                                ? `${app.requestedEps} EPs`
                                : null,
                              app.requestedEt ? `${app.requestedEt} ET` : null,
                              app.requestedEc ? `${app.requestedEc} EC` : null,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </dd>
                        </div>
                      )}
                    </div>

                    {data.quota && isActionable && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-900 mb-2">
                          Quota impact if approved
                        </p>
                        <div className="space-y-1.5">
                          {Boolean(app.categoryE) && data.quota.eTotal > 0 && (
                            <QuotaBar
                              label="E"
                              requested={(app.requestedE as number) ?? 0}
                              allocated={data.allocated.E}
                              total={data.quota.eTotal}
                            />
                          )}
                          {Boolean(app.categoryEs) && data.quota.esTotal > 0 && (
                            <QuotaBar
                              label="Es"
                              requested={(app.requestedEs as number) ?? 0}
                              allocated={data.allocated.Es}
                              total={data.quota.esTotal}
                            />
                          )}
                          {Boolean(app.categoryEp) && data.quota.epTotal > 0 && (
                            <QuotaBar
                              label="EP"
                              requested={(app.requestedEp as number) ?? 0}
                              allocated={data.allocated.EP}
                              total={data.quota.epTotal}
                            />
                          )}
                          {Boolean(app.categoryEps) &&
                            data.quota.epsTotal > 0 && (
                              <QuotaBar
                                label="EPs"
                                requested={(app.requestedEps as number) ?? 0}
                                allocated={data.allocated.EPs}
                                total={data.quota.epsTotal}
                              />
                            )}
                          {Boolean(app.categoryEt) && data.quota.etTotal > 0 && (
                            <QuotaBar
                              label="ET"
                              requested={(app.requestedEt as number) ?? 0}
                              allocated={data.allocated.ET}
                              total={data.quota.etTotal}
                            />
                          )}
                          {Boolean(app.categoryEc) && data.quota.ecTotal > 0 && (
                            <QuotaBar
                              label="EC"
                              requested={(app.requestedEc as number) ?? 0}
                              allocated={data.allocated.EC}
                              total={data.quota.ecTotal}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {Boolean(app.about) && (
                      <div>
                        <dt className="text-gray-500 text-xs mb-1">
                          Coverage plans
                        </dt>
                        <dd className="text-gray-900 bg-gray-50 rounded p-3 leading-relaxed">
                          {app.about as string}
                        </dd>
                      </div>
                    )}
                    {org.orgType === "enr" && Boolean(app.enrProgrammingType) && (
                      <div>
                        <dt className="text-gray-500 text-xs mb-1">ENR programming type</dt>
                        <dd className="text-gray-900 bg-gray-50 rounded p-3 leading-relaxed">
                          {app.enrProgrammingType as string}
                        </dd>
                      </div>
                    )}
                    {(app.resubmissionCount as number) > 0 && (
                      <Field
                        label="Resubmissions"
                        value={app.resubmissionCount as number}
                      />
                    )}
                  </dl>
                </section>

                {/* Publication details */}
                {hasPublication && (
                  <section className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Publication Details
                    </h2>
                    <dl className="space-y-3 text-sm">
                      {pubTypes.length > 0 && (
                        <div>
                          <dt className="text-gray-500 text-xs mb-1">
                            Publication type
                          </dt>
                          <dd className="flex flex-wrap gap-1.5">
                            {pubTypes.map((t) => (
                              <span
                                key={t}
                                className="inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                              >
                                {PUB_TYPE_LABEL[t] ?? t}
                              </span>
                            ))}
                          </dd>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-x-4">
                        <Field
                          label="Circulation / visitors"
                          value={app.circulation as string | number | null}
                        />
                        <Field
                          label="Online unique visitors/month"
                          value={app.onlineUniqueVisitors as string | null}
                        />
                        <Field
                          label="Publication frequency"
                          value={app.publicationFrequency as string | null}
                        />
                        <Field
                          label="Geographical coverage"
                          value={GEO_COVERAGE_LABEL[(app.geographicalCoverage as string | null) ?? ""] ?? (app.geographicalCoverage as string | null)}
                        />
                      </div>
                      {Boolean(app.socialMediaAccounts) && (
                        <div>
                          <dt className="text-gray-500 text-xs mb-1">Social media</dt>
                          <dd className="text-gray-900">{app.socialMediaAccounts as string}</dd>
                        </div>
                      )}
                      {Boolean(app.sportsToCover) && (
                        <div>
                          <dt className="text-gray-500 text-xs mb-1">
                            Sports to cover
                          </dt>
                          <dd className="text-gray-900">
                            {app.sportsToCover as string}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </section>
                )}

                {/* Accreditation history */}
                {hasHistory && (
                  <section className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Accreditation History
                    </h2>
                    <dl className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-x-4">
                        {app.priorOlympic !== null &&
                          app.priorOlympic !== undefined && (
                            <div>
                              <dt className="text-gray-500 text-xs">
                                Prior Olympic accreditation
                              </dt>
                              <dd className="mt-0.5">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${app.priorOlympic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                                >
                                  {app.priorOlympic ? "Yes" : "No"}
                                </span>
                              </dd>
                            </div>
                          )}
                        {app.priorParalympic !== null &&
                          app.priorParalympic !== undefined && (
                            <div>
                              <dt className="text-gray-500 text-xs">
                                Prior Paralympic accreditation
                              </dt>
                              <dd className="mt-0.5">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${app.priorParalympic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                                >
                                  {app.priorParalympic ? "Yes" : "No"}
                                </span>
                              </dd>
                            </div>
                          )}
                      </div>
                      <Field
                        label="Olympic years"
                        value={app.priorOlympicYears as string | null}
                      />
                      <Field
                        label="Paralympic years"
                        value={app.priorParalympicYears as string | null}
                      />
                      {Boolean(app.pastCoverageExamples) && (
                        <div>
                          <dt className="text-gray-500 text-xs mb-1">
                            Past coverage / sporting events
                          </dt>
                          <dd className="text-gray-900 bg-gray-50 rounded p-3 leading-relaxed whitespace-pre-line">
                            {app.pastCoverageExamples as string}
                          </dd>
                        </div>
                      )}
                      {Boolean(app.additionalComments) && (
                        <div>
                          <dt className="text-gray-500 text-xs mb-1">
                            Additional comments
                          </dt>
                          <dd className="text-gray-900 bg-gray-50 rounded p-3 leading-relaxed">
                            {app.additionalComments as string}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </section>
                )}

                {/* Internal note */}
                {Boolean(app.internalNote) && (
                  <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50 text-sm">
                    <div className="font-semibold text-yellow-800 mb-1">
                      Internal note (NOC only)
                    </div>
                    <p className="text-yellow-900">
                      {app.internalNote as string}
                    </p>
                  </div>
                )}

                {/* Audit trail */}
                {data.logs.length > 0 && (
                  <section className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      History
                    </h2>
                    <ol className="space-y-2">
                      {data.logs.map((log) => (
                        <li key={log.id} className="flex gap-3 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                          <div>
                            <span className="font-medium text-gray-900">
                              {AUDIT_ACTION_LABEL[log.action] ?? log.action}
                            </span>
                            {log.actorLabel && (
                              <span className="text-gray-500">
                                {" "}
                                · {log.actorLabel}
                              </span>
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
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                      <strong>Approving this application</strong> confirms the
                      organisation is eligible to apply — it does not commit
                      any accreditation slots. Slot quantities are negotiated
                      in the Press by Number (PbN) phase after all applications
                      are reviewed.
                    </div>

                    {/* Approve */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Accept as Candidate
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        Marks this organisation as a <strong>candidate</strong>{" "}
                        for press accreditation. Slot allocation happens
                        separately in Press by Number.
                      </p>
                      <form action={approveApplication} className="space-y-3">
                        <input type="hidden" name="id" value={app.id} />
                        <textarea
                          name="internal_note"
                          rows={2}
                          placeholder="Internal note (optional, NOC only)"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors cursor-pointer"
                        >
                          Accept as Candidate
                        </button>
                      </form>
                    </div>

                    {/* Return */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Return for Corrections
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        Send back to the applicant with a note explaining what
                        needs to be corrected.
                      </p>
                      <form action={returnApplication} className="space-y-3">
                        <input type="hidden" name="id" value={app.id} />
                        <textarea
                          name="note"
                          required
                          rows={3}
                          placeholder="Explain what the applicant needs to correct..."
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
                    <div className="bg-white rounded-lg border border-red-200 p-4">
                      <h3 className="text-sm font-semibold text-red-700 mb-1">
                        Reject
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        Permanently reject this application.
                      </p>
                      <form action={rejectApplication} className="space-y-3">
                        <input type="hidden" name="id" value={app.id} />
                        <textarea
                          name="note"
                          required
                          rows={3}
                          placeholder="Provide the reason for rejection..."
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
                ) : app.status === "approved" ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Un-approve
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Move this application back to Pending if you need to
                      revise your decision.
                    </p>
                    <form action={unApproveApplication} className="space-y-3">
                      <input type="hidden" name="id" value={app.id} />
                      <input
                        name="reason"
                        type="text"
                        placeholder="Reason (optional)"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded hover:bg-yellow-600 transition-colors cursor-pointer"
                      >
                        Un-approve
                      </button>
                    </form>
                  </div>
                ) : app.status === "returned" ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Cancel Return
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Move this application back to Pending if you returned it
                      in error.
                    </p>
                    <form action={unReturnApplication}>
                      <input type="hidden" name="id" value={app.id} />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded hover:bg-yellow-600 transition-colors cursor-pointer"
                      >
                        Cancel Return
                      </button>
                    </form>
                  </div>
                ) : app.status === "rejected" ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Reverse Rejection
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Move this application back to Pending if the rejection
                      was made in error.
                    </p>
                    <form action={reverseRejection}>
                      <input type="hidden" name="id" value={app.id} />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded hover:bg-yellow-600 transition-colors cursor-pointer"
                      >
                        Reverse Rejection
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-500 text-center">
                    This application has been{" "}
                    {STATUS_LABEL[app.status]?.toLowerCase()} and is no longer
                    editable.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
