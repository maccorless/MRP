import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and, or } from "drizzle-orm";
import { db } from "@/db";
import { magicLinkTokens, applications, organizations } from "@/db/schema";
import { hashToken } from "@/lib/tokens";
import { COUNTRY_CODES, NOC_CODES } from "@/lib/codes";
import { EoiFormTabs, type PrefillData } from "./EoiFormTabs";

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
  }>;
}) {
  const { token, email, from, resubmit, org_name, org_type, country, noc_code, website } = await searchParams;

  if (!token || !email) redirect("/apply");

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
    redirect("/apply?error=invalid_token");
  }

  // Look up an editable application — prefer explicit resubmit param (pending or returned),
  // fall back to auto-detecting a returned app by email.
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

  // Build prefill data
  let prefill: PrefillData | null = null;
  const isFromInvite = from === "invite";

  // Invite pre-fill: read org-level fields from URL params
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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isResubmission ? "Resubmit Application" : isPendingEdit ? "Edit Application" : "LA 2028 Media Accreditation"}
          </h1>
          {!isResubmission && !isPendingEdit && (
            <Link href="/apply/how-it-works" className="shrink-0 text-sm text-[#0057A8] hover:underline mt-1">
              How does this work?
            </Link>
          )}
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          {isResubmission
            ? "Review the feedback below, correct the relevant sections, and resubmit."
            : isPendingEdit
            ? "Your application is still pending review. You can update it below and save your changes."
            : "Expression of Interest for press and photo accreditation at the Olympic and Paralympic Games Los Angeles 2028. Your application will be reviewed by your National Olympic Committee (NOC) before being forwarded to the IOC."}
        </p>
      </div>

      {/* Resubmission note — only shown for returned apps */}
      {isResubmission && returnedRow && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-sm font-semibold text-orange-800 mb-1">
            Returned — corrections required
          </div>
          <p className="text-sm text-orange-700">{returnedRow.app.reviewNote}</p>
          <div className="mt-2 text-xs text-orange-600">
            Reference: <span className="font-mono">{returnedRow.app.referenceNumber}</span>
          </div>
        </div>
      )}

      {/* Pending-edit info note */}
      {isPendingEdit && editRow && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-semibold text-blue-800 mb-1">Application pending review</div>
          <p className="text-sm text-blue-700">
            Your application has not yet been reviewed by your NOC. You can update the details below.
            Once your NOC begins their review you will no longer be able to make changes.
          </p>
          <div className="mt-2 text-xs text-blue-600">
            Reference: <span className="font-mono">{editRow.app.referenceNumber}</span>
          </div>
        </div>
      )}

      {/* Important notes */}
      {!isResubmission && (
        <div className="mb-6 space-y-2 text-xs text-gray-500">
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-0.5">*</span>
            <span>Only one application per organisation will be accepted.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-0.5">*</span>
            <span>Applications should be submitted by an authorised representative (sports editor, managing editor, or equivalent).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-0.5">*</span>
            <span>Fields marked with <span className="text-red-500">*</span> are required. All other fields are optional but help strengthen your application.</span>
          </div>
        </div>
      )}

      <EoiFormTabs
        token={token}
        email={email}
        resubmitId={editRow ? editRow.app.id : null}
        prefill={prefill}
        isResubmission={isResubmission}
        isPendingEdit={isPendingEdit}
        isFromInvite={isFromInvite}
        countryCodes={COUNTRY_CODES}
        nocCodes={NOC_CODES}
      />
    </div>
  );
}
