import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { magicLinkTokens, applications, orgSlotAllocations, organizations, featureFlags } from "@/db/schema";
import { hashToken } from "@/lib/tokens";
import { STATUS_BADGE } from "@/components/StatusBadge";
import { makeT, parseLang, type TranslationKey } from "@/lib/i18n";
import { ORG_TYPE_LABEL } from "@/lib/labels";
import { formatAddress } from "@/lib/format";

async function isPbnResultsPublished(): Promise<boolean> {
  const [flag] = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.name, "pbn_results_published"));
  return flag?.state === "on";
}

/** Map a raw application status to what the applicant should see.
 *
 *  BATCH RELEASE GATE: Applicants must NOT see "Approved as Candidate", "Rejected",
 *  or any other final-decision status until the official batch communication release
 *  date. The `pbn_results_published` feature flag acts as this gate — flip it to "on"
 *  via the IOC Feature Flags panel only when the batch communication has been sent.
 *
 *  Until then, only "Returned for Corrections" is surfaced; everything else (including
 *  approved, rejected, resubmitted) is shown as "Application Under Review".
 *
 *  TODO (batch-release): Wire the actual release-date timestamp here once the batch
 *  communication system is built, so the gate opens automatically at the scheduled time.
 */
function maskStatus(rawStatus: string, pbnPublished: boolean): string {
  if (pbnPublished) return rawStatus;
  if (rawStatus === "returned") return "returned";
  return "pending";
}

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
  searchParams: Promise<{ token?: string; email?: string; lang?: string }>;
}) {
  const { token, email, lang: langParam } = await searchParams;

  if (!token || !email) redirect("/apply/status");

  const CATEGORY_LABEL: Record<string, string> = {
    E: "E — Journalist", Es: "Es — Sport Journalist",
    EP: "EP — Photographer", EPs: "EPs — Sport Photographer",
    ET: "ET — Technical", EC: "EC — Support",
  };

  const tokenHash = hashToken(token);
  const [tokenRecord] = await db
    .select()
    .from(magicLinkTokens)
    .where(and(eq(magicLinkTokens.tokenHash, tokenHash), eq(magicLinkTokens.email, email)));

  if (!tokenRecord || tokenRecord.usedAt !== null || tokenRecord.expiresAt < new Date()) {
    redirect("/apply?error=invalid_token");
  }

  // Resolve language: URL param takes priority; fall back to DB preferredLanguage
  let resolvedLang = langParam;
  if (!resolvedLang) {
    const [appForLang] = await db
      .select({ preferredLanguage: applications.preferredLanguage })
      .from(applications)
      .where(eq(applications.contactEmail, email.toLowerCase()))
      .limit(1);
    if (appForLang?.preferredLanguage) {
      resolvedLang = appForLang.preferredLanguage.toLowerCase();
    }
  }
  const t = makeT(parseLang(resolvedLang));
  const langSuffix = resolvedLang ? `&lang=${resolvedLang}` : "";

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
      <h1 className="text-xl font-bold text-gray-900 mb-1">{t("statusView.title")}</h1>
      <p className="text-gray-500 mb-6 text-sm">{t("statusView.loggedInAs")} {email}</p>

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-500">
          <div className="font-medium text-gray-700 mb-1">{t("statusView.noApps.heading")}</div>
          <p className="text-gray-500">{t("statusView.noApps.body")} <span className="font-medium">{email}</span>.</p>
          <p className="mt-2 text-gray-400">
            {t("statusView.noApps.tryAgain").split("try again").map((part, i) =>
              i === 0 ? part : (
                <><a key="link" href={`/apply/status${langParam ? `?lang=${langParam}` : ""}`} className="text-brand-blue hover:underline">{t("statusView.noApps.tryAgainLink")}</a>{part}</>
              )
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(({ app, org, allocation }) => {
            const displayStatus = maskStatus(app.status, pbnPublished);
            const statusLabelKey = `statusView.status.${displayStatus}` as TranslationKey;
            const statusDescKey = `statusView.desc.${displayStatus}` as TranslationKey;
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

            const orgAddress = formatAddress(org);

            return (
              <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-xs text-gray-400 mb-1">{app.referenceNumber}</div>
                    <div className="font-semibold text-gray-900">{org.name}</div>
                  </div>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[displayStatus]}`}>
                    {t(statusLabelKey)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{t(statusDescKey)}</p>

                {displayStatus === "returned" && app.reviewNote && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                    <div className="font-medium mb-1">{t("statusView.nocNote.heading")}</div>
                    {app.reviewNote}
                  </div>
                )}

                {displayStatus === "approved" && !allocation && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                    <div className="font-medium text-gray-700 mb-1">{t("statusView.allocationInProgress.heading")}</div>
                    {t("statusView.allocationInProgress.body")}
                  </div>
                )}

                {displayStatus === "approved" && allocation && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-xs font-medium text-green-800 mb-2">{t("statusView.allocatedSlots.heading")}</div>
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
                      href={`/apply/form?token=${token}&email=${encodeURIComponent(email)}&resubmit=${app.id}${langSuffix}`}
                      className="inline-block px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors"
                    >
                      {t("statusView.editApplication")}
                    </Link>
                  )}
                  {displayStatus === "returned" && (
                    <Link
                      href={`/apply/form?token=${token}&email=${encodeURIComponent(email)}&resubmit=${app.id}${langSuffix}`}
                      className="inline-block px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors"
                    >
                      {t("statusView.correctResubmit")}
                    </Link>
                  )}
                </div>

                {/* Collapsible read-only application view */}
                <details className="border border-gray-200 rounded-lg overflow-hidden">
                  <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-50 bg-gray-50">
                    {t("statusView.viewSubmitted")}
                  </summary>
                  <div className="px-4 py-4 border-t border-gray-100 divide-y divide-gray-100">

                    <Section title={t("statusView.section.organisation")}>
                      <Row label={t("statusView.row.name")} value={org.name} />
                      <Row label={t("statusView.row.type")} value={ORG_TYPE_LABEL[org.orgType] ?? org.orgType} />
                      <Row label={t("statusView.row.country")} value={org.country} />
                      <Row label={t("statusView.row.noc")} value={app.nocCode} />
                      <Row label={t("statusView.row.website")} value={org.website} />
                      <Row label={t("statusView.row.address")} value={orgAddress || null} />
                    </Section>

                    <div className="pt-4">
                      <Section title={t("statusView.section.primaryContact")}>
                        <Row label={t("statusView.row.name")} value={[app.contactFirstName, app.contactLastName].filter(Boolean).join(" ")} />
                        <Row label={t("statusView.row.title")} value={app.contactTitle} />
                        <Row label={t("statusView.row.email")} value={app.contactEmail} />
                        <Row label={t("statusView.row.phone")} value={app.contactPhone} />
                        <Row label={t("statusView.row.mobile")} value={app.contactCell} />
                      </Section>
                    </div>

                    {(app.secondaryFirstName || app.secondaryLastName) && (
                      <div className="pt-4">
                        <Section title={t("statusView.section.secondaryContact")}>
                          <Row label={t("statusView.row.name")} value={[app.secondaryFirstName, app.secondaryLastName].filter(Boolean).join(" ")} />
                          <Row label={t("statusView.row.title")} value={app.secondaryTitle} />
                          <Row label={t("statusView.row.email")} value={app.secondaryEmail} />
                          <Row label={t("statusView.row.phone")} value={app.secondaryPhone} />
                          <Row label={t("statusView.row.mobile")} value={app.secondaryCell} />
                        </Section>
                      </div>
                    )}

                    <div className="pt-4">
                      <Section title={t("statusView.section.accreditation")}>
                        {categories.length > 0 && (
                          <div className="grid grid-cols-[140px_1fr] gap-x-3 text-sm py-1">
                            <span className="text-gray-500 shrink-0">{t("statusView.row.categories")}</span>
                            <div className="space-y-0.5">
                              {categories.map(([cat, , qty]) => (
                                <div key={cat} className="text-gray-900">
                                  {CATEGORY_LABEL[cat] ?? cat}{qty != null ? ` — ${qty} ${t("statusView.row.requested")}` : ""}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <Row label={t("statusView.row.about")} value={app.about} />
                      </Section>
                    </div>

                    <div className="pt-4">
                      <Section title={t("statusView.section.publication")}>
                        <Row label={t("statusView.row.types")} value={Array.isArray(app.publicationTypes) ? (app.publicationTypes as string[]).join(", ") : null} />
                        <Row label={t("statusView.row.circulation")} value={app.circulation} />
                        <Row label={t("statusView.row.frequency")} value={app.publicationFrequency} />
                        <Row label={t("statusView.row.sportsCovered")} value={app.sportsToCover} />
                      </Section>
                    </div>

                    <div className="pt-4">
                      <Section title={t("statusView.section.history")}>
                        <Row label={t("statusView.row.priorOlympic")} value={app.priorOlympic === true ? t("statusView.row.yes") : app.priorOlympic === false ? t("statusView.row.no") : null} />
                        {app.priorOlympic && <Row label={t("statusView.row.olympicYears")} value={app.priorOlympicYears} />}
                        <Row label={t("statusView.row.priorParalympic")} value={app.priorParalympic === true ? t("statusView.row.yes") : app.priorParalympic === false ? t("statusView.row.no") : null} />
                        {app.priorParalympic && <Row label={t("statusView.row.paralympicYears")} value={app.priorParalympicYears} />}
                        <Row label={t("statusView.row.pastCoverage")} value={app.pastCoverageExamples} />
                        <Row label={t("statusView.row.comments")} value={app.additionalComments} />
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
        {t("statusView.footer")}
      </p>
    </div>
  );
}
