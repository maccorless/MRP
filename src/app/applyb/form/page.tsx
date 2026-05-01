import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and, or } from "drizzle-orm";
import { db } from "@/db";
import { magicLinkTokens, applications, organizations } from "@/db/schema";
import { hashToken } from "@/lib/tokens";
import { COUNTRY_CODES_WITH_NOC, NOC_CODES } from "@/lib/codes";
import { EoiFormWizard, type PrefillData } from "./EoiFormWizard";
import { makeServerT as makeT, parseLang } from "@/lib/i18n/server";

export default async function FormPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    email?: string;
    from?: string;
    resubmit?: string;
    org_name?: string;
    org_type?: string;
    country?: string;
    noc_code?: string;
    website?: string;
    lang?: string;
  }>;
}) {
  const { token, email, from, resubmit, org_name, org_type, country, noc_code, website, lang: langParam } = await searchParams;
  const t = makeT(parseLang(langParam));

  if (!token || !email) redirect("/applyb");

  const tokenHash = hashToken(token);
  const [tokenRecord] = await db
    .select()
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        eq(magicLinkTokens.email, email)
      )
    );

  if (
    !tokenRecord ||
    tokenRecord.usedAt !== null ||
    tokenRecord.expiresAt < new Date()
  ) {
    redirect("/applyb?error=invalid_token");
  }

  let editRow: { app: typeof applications.$inferSelect; org: typeof organizations.$inferSelect } | null = null;

  if (resubmit) {
    const [row] = await db
      .select({ app: applications, org: organizations })
      .from(applications)
      .innerJoin(organizations, eq(applications.organizationId, organizations.id))
      .where(
        and(
          eq(applications.id, resubmit),
          eq(applications.contactEmail, email),
          or(eq(applications.status, "pending"), eq(applications.status, "returned"))
        )
      );
    if (row) editRow = row;
  } else {
    const [row] = await db
      .select({ app: applications, org: organizations })
      .from(applications)
      .innerJoin(organizations, eq(applications.organizationId, organizations.id))
      .where(and(eq(applications.contactEmail, email), eq(applications.status, "returned")));
    if (row) editRow = row;
  }

  const returnedRow = editRow;
  const isReturnedApp = editRow?.app.status === "returned";
  const isResubmission = isReturnedApp;
  const isPendingEdit  = !!editRow && !isReturnedApp;

  let prefill: PrefillData | null = null;
  const isFromInvite = from === "invite";

  if (isFromInvite && !returnedRow) {
    prefill = {
      orgName: org_name ?? "",
      orgWebsite: website ?? null,
      orgType: org_type ?? undefined,
      orgCountry: country ?? undefined,
      orgNocCode: noc_code ?? undefined,
    };
  }

  if (returnedRow) {
    const { app, org } = returnedRow;
    prefill = {
      orgName: org.name,
      orgWebsite: org.website,
      orgType: org.orgType,
      orgCountry: org.country ?? undefined,
      orgNocCode: org.nocCode,
      contactFirstName: app.contactFirstName,
      contactLastName: app.contactLastName,
      contactTitle: app.contactTitle,
      contactPhone: app.contactPhone,
      contactCell: app.contactCell,
      secondaryFirstName: app.secondaryFirstName,
      secondaryLastName: app.secondaryLastName,
      secondaryTitle: app.secondaryTitle,
      secondaryEmail: app.secondaryEmail,
      secondaryPhone: app.secondaryPhone,
      secondaryCell: app.secondaryCell,
      categoryE:   app.categoryE,
      categoryEs:  app.categoryEs,
      categoryEp:  app.categoryEp,
      categoryEps: app.categoryEps,
      categoryEt:  app.categoryEt,
      categoryEc:  app.categoryEc,
      requestedE:   app.requestedE,
      requestedEs:  app.requestedEs,
      requestedEp:  app.requestedEp,
      requestedEps: app.requestedEps,
      requestedEt:  app.requestedEt,
      requestedEc:  app.requestedEc,
      sportsSpecificSport: app.sportsSpecificSport,
      about: app.about,
      orgEmail: org.orgEmail,
      orgTypeOther: app.orgTypeOther,
      pressCard: app.pressCard,
      pressCardIssuer: app.pressCardIssuer,
      enrProgrammingType: app.enrProgrammingType,
      publicationTypes: app.publicationTypes as string[] | null,
      circulation: app.circulation,
      publicationFrequency: app.publicationFrequency,
      sportsToCover: app.sportsToCover,
      onlineUniqueVisitors: app.onlineUniqueVisitors,
      geographicalCoverage: app.geographicalCoverage,
      socialMediaAccounts: app.socialMediaAccounts,
      priorOlympic: app.priorOlympic,
      priorOlympicYears: app.priorOlympicYears,
      priorParalympic: app.priorParalympic,
      priorParalympicYears: app.priorParalympicYears,
      pastCoverageExamples: app.pastCoverageExamples,
      additionalComments: app.additionalComments,
      accessibilityNeeds: app.accessibilityNeeds,
    };
  }

  return (
    <div>
      {/* Beta banner */}
      <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800 flex items-center justify-between gap-3">
        <span><span className="font-semibold">New flow (beta):</span> a 3-step redesign we're testing. Feedback welcome.</span>
        <Link href={`/apply${langParam ? `?lang=${langParam}` : ""}`} className="text-indigo-700 hover:text-indigo-900 underline whitespace-nowrap">
          ← Classic version
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isResubmission ? t("form.title.resubmit") : isPendingEdit ? t("form.title.edit") : t("form.title.new")}
          </h1>
          {!isResubmission && !isPendingEdit && (
            <Link href={`/applyb/how-it-works${langParam ? `?lang=${langParam}` : ""}`} className="shrink-0 text-sm text-brand-blue hover:underline mt-1">
              {t("form.howDoesThisWork")}
            </Link>
          )}
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          {isResubmission
            ? t("form.subtitle.resubmit")
            : isPendingEdit
            ? t("form.subtitle.edit")
            : t("form.subtitle.new")}
        </p>
      </div>

      {/* Resubmission note */}
      {isResubmission && returnedRow && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-sm font-semibold text-orange-800 mb-1">
            {t("form.returnedBanner.heading")}
          </div>
          <p className="text-sm text-orange-700">{returnedRow.app.reviewNote}</p>
          <div className="mt-2 text-xs text-orange-600">
            {t("form.returnedBanner.reference")} <span className="font-mono">{returnedRow.app.referenceNumber}</span>
          </div>
        </div>
      )}

      {/* Pending-edit info note */}
      {isPendingEdit && editRow && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-semibold text-blue-800 mb-1">{t("form.pendingBanner.heading")}</div>
          <p className="text-sm text-blue-700">{t("form.pendingBanner.body")}</p>
          <div className="mt-2 text-xs text-blue-600">
            {t("form.pendingBanner.reference")} <span className="font-mono">{editRow.app.referenceNumber}</span>
          </div>
        </div>
      )}

      <EoiFormWizard
        token={token}
        email={email}
        resubmitId={editRow ? editRow.app.id : null}
        prefill={prefill}
        isResubmission={isResubmission}
        isPendingEdit={isPendingEdit}
        isFromInvite={isFromInvite}
        countryCodes={COUNTRY_CODES_WITH_NOC}
        nocCodes={NOC_CODES}
        lang={parseLang(langParam)}
      />
    </div>
  );
}
