import Link from "next/link";
import { makeServerT as makeT, parseLang } from "@/lib/i18n/server";

export default async function HowItWorksPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: langParam } = await searchParams;
  const t = makeT(parseLang(langParam));
  const langSuffix = langParam ? `?lang=${langParam}` : "";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/applyb${langSuffix}`} className="text-sm text-brand-blue hover:underline">
          {t("hiw.backLink")}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("hiw.title")}</h1>
      <p className="text-gray-500 mb-8">
        {t("hiw.subtitle")}
      </p>

      {/* Steps */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{t("hiw.steps.heading")}</h2>
        <ol className="space-y-5">
          {(["1", "2", "3", "4"] as const).map((n) => (
            <li key={n} className="flex gap-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-blue text-white text-sm font-bold flex items-center justify-center">
                {n}
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-0.5">{t(`hiw.step${n}.title` as Parameters<typeof t>[0])}</div>
                <p className="text-sm text-gray-600">{t(`hiw.step${n}.body` as Parameters<typeof t>[0])}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{t("hiw.categories.heading")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-medium text-gray-500 pb-2 pr-6">{t("hiw.categories.col.code")}</th>
                <th className="text-left font-medium text-gray-500 pb-2">{t("hiw.categories.col.description")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(["E", "Es", "EP", "EPs", "ET", "EC"] as const).map((code) => (
                <tr key={code}>
                  <td className="py-2 pr-6 font-mono font-semibold text-gray-900">{code}</td>
                  <td className="py-2 text-gray-600">{t(`hiw.categories.${code}` as Parameters<typeof t>[0])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {t("hiw.categories.note")}
        </p>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{t("hiw.faq.heading")}</h2>
        <dl className="space-y-5">
          {(["1", "2", "3", "4", "5"] as const).map((n) => (
            <div key={n}>
              <dt className="font-medium text-gray-900 mb-1">{t(`hiw.faq.q${n}` as Parameters<typeof t>[0])}</dt>
              <dd className="text-sm text-gray-600">{t(`hiw.faq.a${n}` as Parameters<typeof t>[0])}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="text-center">
        <Link
          href={`/applyb${langSuffix}`}
          className="inline-block px-6 py-3 bg-brand-blue text-white text-sm font-semibold rounded-md hover:bg-blue-800 transition-colors"
        >
          {t("hiw.readyToApply")}
        </Link>
      </div>
    </div>
  );
}
