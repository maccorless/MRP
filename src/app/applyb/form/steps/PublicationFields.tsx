"use client";

import type { PrefillData } from "../EoiFormWizard";

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

/** Media Questions section of the LA28 Apr 2026 EoI spec — all optional. */
export function PublicationFields({ prefill }: { prefill: PrefillData | null }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        These fields are optional but help your NOC assess reach and fit.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="circulation" className={LABEL}>
            Publication circulation per month <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="circulation" name="circulation" type="text" data-tab="3"
            defaultValue={prefill?.circulation ?? ""}
            placeholder="e.g. 180,000"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="publication_frequency" className={LABEL}>
            Frequency of publication <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="publication_frequency" name="publication_frequency" type="text" data-tab="3"
            defaultValue={prefill?.publicationFrequency ?? ""}
            placeholder="daily / weekly / monthly / other"
            className={INPUT}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="online_unique_visitors" className={LABEL}>
            Online unique visitors per month <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="online_unique_visitors" name="online_unique_visitors" type="text" data-tab="3"
            defaultValue={prefill?.onlineUniqueVisitors ?? ""}
            placeholder="e.g. 14,000,000"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="geographical_coverage" className={LABEL}>
            Geographical coverage <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            id="geographical_coverage" name="geographical_coverage" data-tab="3"
            defaultValue={prefill?.geographicalCoverage ?? ""}
            className={INPUT}
          >
            <option value="">Select…</option>
            <option value="international">International</option>
            <option value="national">National</option>
            <option value="local">Local / Regional</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="enr_programming_type" className={LABEL}>
          If applying for ENR accreditation — type of programming <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="enr_programming_type" name="enr_programming_type" rows={2} data-tab="3"
          defaultValue={prefill?.enrProgrammingType ?? ""}
          placeholder="e.g. news programme / sports programme"
          className={`${INPUT} resize-none`}
        />
      </div>

      <div>
        <label htmlFor="social_media_accounts" className={LABEL}>
          Social media accounts <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="social_media_accounts" name="social_media_accounts" rows={2} data-tab="3"
          defaultValue={prefill?.socialMediaAccounts ?? ""}
          placeholder="Links or handles — one per line"
          className={`${INPUT} resize-none`}
        />
      </div>
    </div>
  );
}
