import { requireNocSession } from "@/lib/session";
import { COUNTRY_CODES, NOC_CODES } from "@/lib/codes";
import { submitFastTrackApplication } from "./actions";

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

export default async function FastTrackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await requireNocSession();
  const { error } = await searchParams;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Fast-Track Entry — {session.nocCode}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Submit an EoI on behalf of a known organisation. The application is auto-approved immediately.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {ERROR_MSG[error] ?? "An error occurred."}
        </div>
      )}

      <form action={submitFastTrackApplication} className="space-y-6">
        {/* Organisation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Organisation</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Organisation name <span className="text-red-500">*</span>
              </label>
              <input
                name="org_name" type="text" required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="org_type" required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">— Select —</option>
                {ORG_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Country</label>
              <input
                name="country" type="text" list="country-list"
                placeholder="e.g. US"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Primary Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                name="contact_name" type="text" required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="contact_email" type="email" required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Accreditation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Accreditation Categories</h2>
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
                  className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">About</h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Brief description of the organisation and coverage plans <span className="text-red-500">*</span>
            </label>
            <textarea
              name="about" required rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="px-5 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer"
          >
            Submit &amp; Approve
          </button>
          <span className="text-xs text-gray-400">
            This application will be immediately approved and added to the PbN queue.
          </span>
        </div>
      </form>
    </div>
  );
}
