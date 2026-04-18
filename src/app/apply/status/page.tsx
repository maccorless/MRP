import { redirect } from "next/navigation";
import { db } from "@/db";
import { magicLinkTokens } from "@/db/schema";
import { generateToken, hashToken } from "@/lib/tokens";
import { requestStatusToken } from "./actions";
import { makeT, parseLang } from "@/lib/i18n";

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string; lang?: string }>;
}) {
  const { error, email, lang: langParam } = await searchParams;
  const t = makeT(parseLang(langParam));
  const langSuffix = langParam ? `&lang=${langParam}` : "";

  // When email is passed in the URL (e.g. arriving from the submission confirmation page),
  // skip the form and generate a status token directly.
  if (email && !error) {
    const clean = email.trim().toLowerCase();
    if (clean.includes("@") && clean.includes(".")) {
      const token = generateToken();
      // Status tokens last 90 days — same as requestStatusToken in actions.ts
      const statusExpiryHours = parseInt(
        process.env.STATUS_TOKEN_EXPIRY_HOURS ?? String(90 * 24),
        10
      );
      const expiresAt = new Date(Date.now() + statusExpiryHours * 60 * 60 * 1000);
      await db.insert(magicLinkTokens).values({ email: clean, tokenHash: hashToken(token), expiresAt });
      redirect(`/apply/status/view?token=${token}&email=${encodeURIComponent(clean)}${langSuffix}`);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">{t("status.title")}</h1>
      <p className="text-gray-500 mb-8">
        {t("status.subtitle")}
      </p>

      {error === "invalid_email" && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {t("status.error.invalid_email")}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form action={requestStatusToken}>
          {langParam && <input type="hidden" name="lang" value={langParam} />}
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            {t("status.email.label")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={email ?? ""}
            placeholder="you@newsorg.com"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
          <button
            type="submit"
            className="mt-4 w-full bg-brand-blue text-white rounded px-4 py-2.5 text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
          >
            {t("status.submit")}
          </button>
          <p className="mt-2 text-xs text-gray-400 text-center">
            {t("status.tokenNote")}
          </p>
        </form>
      </div>
    </div>
  );
}
