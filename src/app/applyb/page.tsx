import Link from "next/link";
import { requestToken } from "./actions";
import { makeServerT as makeT, parseLang } from "@/lib/i18n/server";

export default async function ApplyBPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; lang?: string }>;
}) {
  const { error, lang: langParam } = await searchParams;
  const t = makeT(parseLang(langParam));
  const langSuffix = langParam ? `?lang=${langParam}` : "";

  const redErrors = ["invalid_email", "invalid_token", "invalid_country", "invalid_noc", "rate_limited", "application_limit"] as const;
  const orangeErrors = ["window_closed"] as const;

  return (
    <div>
      {/* Beta banner */}
      <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800 flex items-center justify-between gap-3">
        <span><span className="font-semibold">New flow (beta):</span> a 3-step redesign we're testing. Feedback welcome.</span>
        <Link href={`/apply${langSuffix}`} className="text-indigo-700 hover:text-indigo-900 underline whitespace-nowrap">
          ← Classic version
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {t("apply.title")}
      </h1>
      <p className="text-gray-500 mb-8">
        {t("apply.subtitle")}
      </p>

      {redErrors.map((code) =>
        error === code ? (
          <div key={code} role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {t(`apply.error.${code}`)}
          </div>
        ) : null
      )}
      {orangeErrors.map((code) =>
        error === code ? (
          <div key={code} role="alert" className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
            {t(`apply.error.${code}`)}
          </div>
        ) : null
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form action={requestToken}>
          {langParam && <input type="hidden" name="lang" value={langParam} />}
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("apply.email.label")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("apply.email.placeholder")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            {t("apply.email.help")}
          </p>

          <button
            type="submit"
            className="mt-4 w-full bg-brand-blue text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
          >
            {t("apply.submit")}
          </button>
        </form>
      </div>

      {/* TODO(A12): Replace with final copy from OCOG/legal before go-live */}
      <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 leading-relaxed">
        <span className="font-medium text-gray-600">Data protection notice:</span>{" "}
        Personal data submitted via this form will be processed by the LA 2028 Organising Committee,
        the International Olympic Committee, and your National Olympic Committee for the purpose of
        evaluating press accreditation applications for the Olympic Games Los Angeles 2028.
        Data will be retained in accordance with applicable law and the IOC data-protection policy.
        [<span className="italic">Final wording pending OCOG/legal review — placeholder copy only.</span>]
      </div>

      <p className="mt-4 text-xs text-gray-500 text-center">
        {t("apply.alreadyHaveRef")}
      </p>
    </div>
  );
}
