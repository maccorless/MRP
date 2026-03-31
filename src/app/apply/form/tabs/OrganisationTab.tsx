import type { FormErrors, PrefillData } from "../EoiFormTabs";

const BASE_INPUT = "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const HELP = "text-xs text-gray-400 mt-1";

function inp(name: string, errors?: FormErrors) {
  return `${BASE_INPUT} ${errors?.[name] ? "border-red-500" : "border-gray-300"}`;
}
function Err({ name, errors }: { name: string; errors?: FormErrors }) {
  if (!errors?.[name]) return null;
  return <p className="text-xs text-red-500 mt-1" role="alert">{errors[name]}</p>;
}

export function OrganisationTab({
  prefill,
  isResubmission,
  countryCodes,
  nocCodes,
  errors,
}: {
  prefill: PrefillData | null;
  isResubmission: boolean;
  countryCodes: { code: string; name: string }[];
  nocCodes: { code: string; name: string }[];
  errors?: FormErrors;
}) {
  if (isResubmission && prefill) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
          Organisation details cannot be changed on resubmission. If this information is incorrect, contact your NOC directly.
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div><dt className="text-gray-500 text-xs">Organisation</dt><dd className="font-medium text-gray-900">{prefill.orgName}</dd></div>
          <div><dt className="text-gray-500 text-xs">NOC</dt><dd className="text-gray-900">{prefill.orgNocCode}</dd></div>
          <div><dt className="text-gray-500 text-xs">Country</dt><dd className="text-gray-900">{prefill.orgCountry}</dd></div>
          <div><dt className="text-gray-500 text-xs">Type</dt><dd className="text-gray-900">{prefill.orgType}</dd></div>
        </dl>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        Tell us about your media organisation. Your NOC uses this information to evaluate eligibility and route your application.
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="org_name" className={LABEL}>
            Organisation name <span className="text-red-500">*</span>
          </label>
          <input id="org_name" name="org_name" type="text" required data-tab="0"
            defaultValue={prefill?.orgName ?? ""} placeholder="e.g. The Associated Press" className={inp("org_name", errors)} />
          <Err name="org_name" errors={errors} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="website" className={LABEL}>Website</label>
          <input id="website" name="website" type="url" data-tab="0"
            defaultValue={prefill?.orgWebsite ?? ""} placeholder="https://" className={BASE_INPUT + " border-gray-300"} />
        </div>
      </div>

      <div>
        <label htmlFor="org_type" className={LABEL}>
          Organisation type <span className="text-red-500">*</span>
        </label>
        <select id="org_type" name="org_type" required data-tab="0"
          defaultValue={prefill?.orgType ?? ""} className={inp("org_type", errors)}>
          <option value="" disabled>Select type...</option>
          <option value="media_print_online">Print / Online Media</option>
          <option value="media_broadcast">Broadcast</option>
          <option value="news_agency">News Agency</option>
        </select>
        <Err name="org_type" errors={errors} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="country" className={LABEL}>Country <span className="text-red-500">*</span></label>
          <input id="country" name="country" type="text" required data-tab="0"
            list="country-codes" placeholder="US — United States" className={inp("country", errors)} />
          <datalist id="country-codes">
            {countryCodes.map(({ code, name }) => (
              <option key={code} value={`${code} — ${name}`} />
            ))}
          </datalist>
          <Err name="country" errors={errors} />
          <p className={HELP}>Type a code or country name</p>
        </div>
        <div>
          <label htmlFor="noc_code" className={LABEL}>NOC code <span className="text-red-500">*</span></label>
          <input id="noc_code" name="noc_code" type="text" required data-tab="0"
            list="noc-codes" placeholder="USA — United States of America" className={inp("noc_code", errors)} />
          <datalist id="noc-codes">
            {nocCodes.map(({ code, name }) => (
              <option key={code} value={`${code} — ${name}`} />
            ))}
          </datalist>
          <Err name="noc_code" errors={errors} />
          <p className={HELP}>Type a code or country name</p>
        </div>
      </div>

      {/* Address (optional) */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Mailing Address <span className="text-gray-400 font-normal">(optional)</span></h3>
        <div className="space-y-3">
          <input name="address" type="text" data-tab="0" placeholder="Street address" className={BASE_INPUT + " border-gray-300"} />
          <input name="address2" type="text" data-tab="0" placeholder="Suite, floor, building (optional)" className={BASE_INPUT + " border-gray-300"} />
          <div className="grid grid-cols-3 gap-3">
            <input name="city" type="text" data-tab="0" placeholder="City" className={BASE_INPUT + " border-gray-300"} />
            <input name="state_province" type="text" data-tab="0" placeholder="State / Province" className={BASE_INPUT + " border-gray-300"} />
            <input name="postal_code" type="text" data-tab="0" placeholder="Postal code" className={BASE_INPUT + " border-gray-300"} />
          </div>
        </div>
      </div>

      {/* Flags */}
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <div>
          <label className={LABEL}>Are you a freelancer?</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="is_freelancer" value="yes" data-tab="0" className="accent-[#0057A8]" /> Yes</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="is_freelancer" value="no" data-tab="0" className="accent-[#0057A8]" defaultChecked /> No</label>
          </div>
        </div>
        <div>
          <label className={LABEL}>Will any attending media member require wheelchair accessibility?</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="accessibility_needs" value="yes" data-tab="0" className="accent-[#0057A8]" /> Yes</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="accessibility_needs" value="no" data-tab="0" className="accent-[#0057A8]" defaultChecked /> No</label>
          </div>
          <p className={HELP}>Venue accessibility arrangements will be coordinated if needed.</p>
        </div>
      </div>
    </div>
  );
}
