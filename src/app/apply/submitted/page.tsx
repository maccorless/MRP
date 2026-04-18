import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations } from "@/db/schema";
import { makeT, parseLang } from "@/lib/i18n";

const CATEGORY_LABEL: Record<string, string> = {
  E: "E — Journalist", Es: "Es — Sport Journalist",
  EP: "EP — Photographer", EPs: "EPs — Sport Photographer",
  ET: "ET — Technical", EC: "EC — Support",
};

export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; resubmit?: string; email?: string; lang?: string }>;
}) {
  const { ref, resubmit, email, lang: langParam } = await searchParams;

  if (!ref) redirect("/apply");

  const t = makeT(parseLang(langParam));
  const isResubmission = resubmit === "1";

  // Look up the application for email preview data
  const [appRow] = await db
    .select({
      contactFirstName: applications.contactFirstName,
      orgName: organizations.name,
      categoryE:   applications.categoryE,
      categoryEs:  applications.categoryEs,
      categoryEp:  applications.categoryEp,
      categoryEps: applications.categoryEps,
      categoryEt:  applications.categoryEt,
      categoryEc:  applications.categoryEc,
    })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(eq(applications.referenceNumber, ref));

  const categories = appRow
    ? (
        [
          ["E",   appRow.categoryE],
          ["Es",  appRow.categoryEs],
          ["EP",  appRow.categoryEp],
          ["EPs", appRow.categoryEps],
          ["ET",  appRow.categoryEt],
          ["EC",  appRow.categoryEc],
        ] as [string, boolean | null][]
      )
        .filter(([, checked]) => checked)
        .map(([cat]) => CATEGORY_LABEL[cat] ?? cat)
    : [];

  const firstName = appRow?.contactFirstName ?? null;
  const orgName   = appRow?.orgName ?? "";
  const langSuffix = langParam ? `&lang=${langParam}` : "";

  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {isResubmission ? t("submitted.title.resubmit") : t("submitted.title.new")}
      </h1>
      <p className="text-gray-500 mb-8">
        {isResubmission
          ? t("submitted.subtitle.resubmit")
          : t("submitted.subtitle.new")}
      </p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 inline-block text-left min-w-64">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {t("submitted.refLabel")}
        </div>
        <div className="text-xl font-mono font-bold text-brand-blue">{ref}</div>
        <p className="text-xs text-gray-400 mt-2">
          {t("submitted.refHelp")}
        </p>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p className="font-medium mb-2">{t("submitted.nextSteps")}</p>
        <ol className="text-sm text-gray-600 text-left max-w-xs mx-auto space-y-1 list-decimal list-inside">
          <li>{t("submitted.step1")}</li>
          <li>{t("submitted.step2")}</li>
          <li>{t("submitted.step3")}</li>
        </ol>
      </div>

      <div className="mt-6">
        <Link
          href={email ? `/apply/status?email=${encodeURIComponent(email)}${langSuffix}` : `/apply/status${langParam ? `?lang=${langParam}` : ""}`}
          className="inline-block px-5 py-2.5 bg-brand-blue text-white text-sm font-semibold rounded-md hover:bg-blue-800 transition-colors"
        >
          {t("submitted.viewStatus")}
        </Link>
      </div>

      {/* Draft email preview */}
      {!isResubmission && (
        <div className="mt-10 max-w-xl mx-auto text-left">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400 shrink-0">{t("submitted.emailPreviewLabel")}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-3 text-xs text-amber-800">
            <span className="font-semibold">Note:</span> {t("submitted.emailPreviewNote")}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden text-left text-sm">
            {/* Email header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 space-y-1 text-xs text-gray-600">
              <div><span className="text-gray-400 w-12 inline-block">{t("submitted.email.from")}</span> LA 2028 Press Registration &lt;noreply@prp.la28.org&gt;</div>
              <div><span className="text-gray-400 w-12 inline-block">{t("submitted.email.to")}</span> {email ?? "applicant@example.com"}</div>
              <div><span className="text-gray-400 w-12 inline-block">{t("submitted.email.subject")}</span> {t("submitted.email.subjectValue")}</div>
            </div>

            {/* Email body */}
            <div className="px-6 py-5 text-gray-800 space-y-4">
              <p>{t("submitted.email.dear")} {firstName ?? "Applicant"},</p>

              <p>
                {t("submitted.email.body1")}
                {" "}<strong>{t("submitted.email.gamesBold")}</strong>.
              </p>

              <p>
                {t("submitted.email.body2")}
              </p>

              <div className="bg-gray-50 rounded-md p-4 text-sm space-y-1.5">
                <div className="grid grid-cols-[130px_1fr] gap-x-2">
                  <span className="text-gray-500">{t("submitted.email.refNumber")}</span>
                  <span className="font-mono font-semibold text-brand-blue">{ref}</span>
                </div>
                {orgName && (
                  <div className="grid grid-cols-[130px_1fr] gap-x-2">
                    <span className="text-gray-500">{t("submitted.email.organisation")}</span>
                    <span>{orgName}</span>
                  </div>
                )}
                {categories.length > 0 && (
                  <div className="grid grid-cols-[130px_1fr] gap-x-2">
                    <span className="text-gray-500">{t("submitted.email.categoriesRequested")}</span>
                    <span>{categories.join(", ")}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="font-medium mb-1">{t("submitted.email.nextSteps")}</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>{t("submitted.email.step1")}</li>
                  <li>{t("submitted.email.step2")}</li>
                  <li>{t("submitted.email.step3")}</li>
                </ol>
              </div>

              <p>
                {t("submitted.email.contact")} <span className="text-brand-blue">{t("submitted.email.statusUrl")}</span>.
              </p>

              <p className="text-gray-600">
                {t("submitted.email.regards")}<br />
                <span className="font-medium">{t("submitted.email.team")}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
