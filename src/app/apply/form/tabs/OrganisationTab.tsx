"use client";

import { useState } from "react";
import type { FormErrors, PrefillData } from "../EoiFormTabs";

const BASE_INPUT = "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const HELP = "text-xs text-gray-400 mt-1";

function inp(name: string, errors?: FormErrors) {
  return `${BASE_INPUT} ${errors?.[name] ? "border-red-500" : "border-gray-300"}`;
}
function Err({ name, errors }: { name: string; errors?: FormErrors }) {
  if (!errors?.[name]) return null;
  return <p id={`err-${name}`} className="text-xs text-red-500 mt-1" role="alert">{errors[name]}</p>;
}

export function OrganisationTab({
  prefill,
  isResubmission,
  countryCodes,
  nocCodes,
  errors,
  nocAutoSuggestedName,
}: {
  prefill: PrefillData | null;
  isResubmission: boolean;
  countryCodes: { code: string; name: string }[];
  nocCodes: { code: string; name: string }[];
  errors?: FormErrors;
  nocAutoSuggestedName?: string | null;
}) {
  const [orgType, setOrgType] = useState<string>(prefill?.orgType ?? "");
  const [pressCardHeld, setPressCardHeld] = useState<boolean | null>(null);

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
            defaultValue={prefill?.orgName ?? ""} placeholder="e.g. The Associated Press" className={inp("org_name", errors)}
            aria-invalid={!!errors?.org_name} aria-describedby={errors?.org_name ? "err-org_name" : undefined} />
          <Err name="org_name" errors={errors} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="website" className={LABEL}>Website</label>
          <input id="website" name="website" type="url" data-tab="0"
            defaultValue={prefill?.orgWebsite ?? ""} placeholder="https://" className={inp("website", errors)}
            aria-invalid={!!errors?.website} aria-describedby={errors?.website ? "err-website" : undefined} />
          <Err name="website" errors={errors} />
        </div>
      </div>

      {/* Org email */}
      <div>
        <label htmlFor="org-email" className="block text-xs font-medium text-gray-700 mb-1">
          Email Address of the Organisation <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="org-email"
          name="org_email"
          type="email"
          placeholder="e.g. press@yourorg.com"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
        />
      </div>

      <div>
        <label htmlFor="org_type" className={LABEL}>
          Organisation type <span className="text-red-500">*</span>
        </label>
        <select id="org_type" name="org_type" required data-tab="0"
          value={orgType} onChange={(e) => setOrgType(e.target.value)} className={inp("org_type", errors)}
          aria-invalid={!!errors?.org_type} aria-describedby={errors?.org_type ? "err-org_type" : undefined}>
          <option value="" disabled>Select type...</option>
          <option value="media_print_online">Print / Online Media</option>
          <option value="media_broadcast">Broadcast</option>
          <option value="news_agency">News Agency</option>
          <option value="freelancer">Freelancer / Independent</option>
          <option value="other">Other (please specify)</option>
        </select>
        <Err name="org_type" errors={errors} />
      </div>

      {orgType === "other" && (
        <div>
          <label htmlFor="org-type-other" className="block text-sm font-medium text-gray-700 mb-1">
            Please specify type <span className="text-red-500">*</span>
          </label>
          <input
            id="org-type-other"
            type="text"
            name="org_type_other"
            placeholder="Please describe your organisation type"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="country" className={LABEL}>Country <span className="text-red-500">*</span></label>
          <input id="country" name="country" type="text" required data-tab="0"
            list="country-codes" placeholder="US — United States" className={inp("country", errors)}
            aria-invalid={!!errors?.country} aria-describedby={errors?.country ? "err-country" : undefined} />
          <datalist id="country-codes">
            {countryCodes.map(({ code, name }) => (
              <option key={code} value={`${code} — ${name}`} />
            ))}
          </datalist>
          <Err name="country" errors={errors} />
          <p className={HELP}>Type a code or country name</p>
        </div>
        <div>
          <label htmlFor="noc_code" className={LABEL}>
            Responsible NOC <span className="text-red-500">*</span>
          </label>
          <input id="noc_code" name="noc_code" type="text" required data-tab="0"
            list="noc-codes" placeholder="USA — United States of America" className={inp("noc_code", errors)}
            aria-invalid={!!errors?.noc_code} aria-describedby="noc-help" />
          <datalist id="noc-codes">
            {nocCodes.map(({ code, name }) => (
              <option key={code} value={`${code} — ${name}`} />
            ))}
          </datalist>
          <Err name="noc_code" errors={errors} />
          {nocAutoSuggestedName ? (
            <p id="noc-help" className="text-xs text-[#0057A8] mt-1">
              Auto-selected: <strong>{nocAutoSuggestedName}</strong> based on your country.
              Change this if your organisation is reviewed by a different NOC.
            </p>
          ) : (
            <p id="noc-help" className={HELP}>
              The National Olympic Committee responsible for reviewing your application.
              Usually matches your country — select your country above to auto-fill.
            </p>
          )}
        </div>
      </div>

      {/* Address (optional) */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Mailing Address <span className="text-gray-400 font-normal">(optional)</span></h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="address" className="sr-only">Street address</label>
            <input id="address" name="address" type="text" data-tab="0" placeholder="Street address" className={BASE_INPUT + " border-gray-300"} />
          </div>
          <div>
            <label htmlFor="address2" className="sr-only">Suite, floor, building</label>
            <input id="address2" name="address2" type="text" data-tab="0" placeholder="Suite, floor, building (optional)" className={BASE_INPUT + " border-gray-300"} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="city" className="sr-only">City</label>
              <input id="city" name="city" type="text" data-tab="0" placeholder="City" className={BASE_INPUT + " border-gray-300"} />
            </div>
            <div>
              <label htmlFor="state_province" className="sr-only">State / Province</label>
              <input id="state_province" name="state_province" type="text" data-tab="0" placeholder="State / Province" className={BASE_INPUT + " border-gray-300"} />
            </div>
            <div>
              <label htmlFor="postal_code" className="sr-only">Postal code</label>
              <input id="postal_code" name="postal_code" type="text" data-tab="0" placeholder="Postal code" className={BASE_INPUT + " border-gray-300"} />
            </div>
          </div>
        </div>
      </div>

      {/* Flags */}
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <fieldset>
          <legend className={LABEL}>Will any attending media member require wheelchair accessibility?</legend>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="accessibility_needs" value="yes" data-tab="0" className="accent-[#0057A8]" /> Yes</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="accessibility_needs" value="no" data-tab="0" className="accent-[#0057A8]" defaultChecked /> No</label>
          </div>
          <p className={HELP}>Venue accessibility arrangements will be coordinated if needed.</p>
        </fieldset>
      </div>

      {/* Press card (freelancers only) */}
      {orgType === "freelancer" && (
        <fieldset className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
          <legend className="text-xs font-medium text-gray-700 px-1">Press Card</legend>
          <div className="mt-2">
            <p className="text-xs text-gray-700 mb-2">Do you hold a Press Card? <span className="text-red-500">*</span></p>
            <label className="inline-flex items-center gap-1.5 text-sm mr-4">
              <input type="radio" name="press_card" value="yes" onChange={() => setPressCardHeld(true)} required />
              Yes
            </label>
            <label className="inline-flex items-center gap-1.5 text-sm">
              <input type="radio" name="press_card" value="no" onChange={() => setPressCardHeld(false)} />
              No
            </label>
          </div>
          {pressCardHeld && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Issuing organisation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="press_card_issuer"
                placeholder="e.g. National Press Association"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
              />
            </div>
          )}
        </fieldset>
      )}
    </div>
  );
}
