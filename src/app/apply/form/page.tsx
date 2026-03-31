import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { magicLinkTokens, applications, organizations } from "@/db/schema";
import { hashToken } from "@/lib/tokens";
import { COUNTRY_CODES, NOC_CODES } from "@/lib/codes";
import { EoiFormTabs, type PrefillData } from "./EoiFormTabs";

export default async function FormPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

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

  // Check for a returned application to resubmit
  const [returnedRow] = await db
    .select({ app: applications, org: organizations })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(
      and(
        eq(applications.contactEmail, email),
        eq(applications.status, "returned")
      )
    );

  const isResubmission = !!returnedRow;

  // Build prefill data
  let prefill: PrefillData | null = null;
  if (returnedRow) {
    const { app, org } = returnedRow;
    prefill = {
      orgName: org.name,
      orgWebsite: org.website,
      orgType: org.orgType,
      orgCountry: org.country,
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
      categoryPress: app.categoryPress,
      categoryPhoto: app.categoryPhoto,
      requestedPress: app.requestedPress,
      requestedPhoto: app.requestedPhoto,
      about: app.about,
      publicationTypes: app.publicationTypes as string[] | null,
      circulation: app.circulation,
      publicationFrequency: app.publicationFrequency,
      sportsToCover: app.sportsToCover,
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {isResubmission ? "Resubmit Application" : "LA 2028 Media Accreditation"}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          {isResubmission
            ? "Review the feedback below, correct the relevant sections, and resubmit."
            : "Expression of Interest for press and photo accreditation at the Olympic and Paralympic Games Los Angeles 2028. Your application will be reviewed by your National Olympic Committee (NOC) before being forwarded to the IOC."}
        </p>
      </div>

      {/* Resubmission note */}
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
        resubmitId={isResubmission && returnedRow ? returnedRow.app.id : null}
        prefill={prefill}
        isResubmission={isResubmission}
        countryCodes={COUNTRY_CODES}
        nocCodes={NOC_CODES}
      />
    </div>
  );
}
