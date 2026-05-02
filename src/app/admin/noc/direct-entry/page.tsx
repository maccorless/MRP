import { requireNocSession } from "@/lib/session";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";
import { submitDirectEntryApplication } from "./actions";
import DirectEntryForm from "./DirectEntryForm";

const ERROR_MSG: Record<string, string> = {
  missing_fields: "Please fill in all required fields.",
  no_category:    "Please select at least one accreditation category.",
};

export default async function DirectEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await requireNocSession();
  const lang = await getAdminLang();
  const s = t(lang);
  const { error } = await searchParams;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{s.direct.title} — {session.nocCode}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Submit an EoI on behalf of a known organisation. The application is auto-approved immediately.
        </p>
      </div>

      {/* NOC E guidance */}
      <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
        <p className="font-semibold mb-1">Tip: Nominating your own communications staff (NOC E slots)</p>
        <p>
          Your IOC quota includes <strong>E (Journalist)</strong> slots that can be used for your NOC&apos;s own
          communications and media staff — not just external media organisations. To use these, create an entry
          here for your NOC communications team (e.g. &ldquo;USA Olympic &amp; Paralympic Committee — Communications&rdquo;),
          select category E, and enter the number of staff you wish to credential. This will be allocated from
          your E quota during Press by Number.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {ERROR_MSG[error] ?? "An error occurred."}
        </div>
      )}

      <DirectEntryForm action={submitDirectEntryApplication} nocCode={session.nocCode} />
    </div>
  );
}
