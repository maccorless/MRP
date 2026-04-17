import { requireNocSession } from "@/lib/session";
import { COUNTRY_CODES, NOC_CODES } from "@/lib/codes";
import { submitDirectEntryApplication } from "./actions";

const ORG_TYPE_OPTIONS = [
  { value: "media_print_online", label: "Print / Online" },
  { value: "media_broadcast",    label: "Broadcast" },
  { value: "news_agency",        label: "News Agency" },
];

const CATEGORIES: { key: string; label: string; sub: string }[] = [
  { key: "e",   label: "E",   sub: "Journalist" },
  { key: "es",  label: "Es",  sub: "Sport-Specific Journalist" },
  { key: "ep",  label: "EP",  sub: "Photographer" },
  { key: "eps", label: "EPs", sub: "Sport-Specific Photographer" },
  { key: "et",  label: "ET",  sub: "Technician" },
  { key: "ec",  label: "EC",  sub: "Support Staff" },
];

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
  const { error } = await searchParams;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Direct Entry — {session.nocCode}</h1>
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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {ERROR_MSG[error] ?? "An error occurred."}
        </div>
      )}

      <form action={submitDirectEntryApplication} className="space-y-6">
        {/* Organisation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Organisation</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Organisation name <span className="text-red-500">*</span>
              </label>
              <input
                name="org_name" type="text" required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="org_type" required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
              >
                <option value="">— Select —</option>
                {ORG_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                name="country" type="text" list="country-list" required
                placeholder="e.g. US"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
              />
              <datalist id="country-list">
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </datalist>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Website</label>
              <input
                name="website" type="url" placeholder="https://"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Primary Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                name="contact_name" type="text" required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="contact_email" type="email" required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
              />
            </div>
          </div>
        </div>

        {/* Accreditation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Accreditation Categories</h2>
          <p className="text-xs text-gray-500">Select all that apply and enter requested slot quantities.</p>
          <div className="space-y-3">
            {CATEGORIES.map(({ key, label, sub }) => (
              <div key={key} className="flex items-center gap-4">
                <label className="flex items-center gap-2 w-56 cursor-pointer">
                  <input
                    type="checkbox" name={`category_${key}`}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                  <span className="text-xs text-gray-500">{sub}</span>
                </label>
                <input
                  type="number" name={`requested_${key}`}
                  min={0} placeholder="slots"
                  aria-label={`${label} (${sub}) — requested slots`}
                  className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notes</h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Notes (optional)
            </label>
            <textarea
              name="about" rows={3}
              placeholder="Internal context for this organisation (not shown to the applicant)"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="px-5 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer"
          >
            Submit &amp; Accept as Candidate
          </button>
          <span className="text-xs text-gray-400">
            This application will be immediately accepted as a candidate and added to the PbN queue.
          </span>
        </div>
      </form>
    </div>
  );
}
