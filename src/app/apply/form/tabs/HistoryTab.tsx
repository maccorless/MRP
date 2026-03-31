"use client";

import { useState } from "react";
import type { PrefillData } from "../EoiFormTabs";

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const HELP = "text-xs text-gray-400 mt-1";

export function HistoryTab({ prefill }: { prefill: PrefillData | null }) {
  const [priorOlympic, setPriorOlympic] = useState<string>(
    prefill?.priorOlympic === true ? "yes" : prefill?.priorOlympic === false ? "no" : ""
  );
  const [priorParalympic, setPriorParalympic] = useState<string>(
    prefill?.priorParalympic === true ? "yes" : prefill?.priorParalympic === false ? "no" : ""
  );

  const noPrior = priorOlympic === "no" && priorParalympic === "no";

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        Prior accreditation history helps establish your organisation's track record covering major international sporting events.
        If this is your first application, that's completely fine — just tell us about your sports coverage experience.
      </div>

      {/* Olympic history */}
      <div>
        <label className={LABEL}>Has your organisation received Olympic accreditation in the past?</label>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="prior_olympic" value="yes" data-tab="4"
              checked={priorOlympic === "yes"} onChange={() => setPriorOlympic("yes")} className="accent-[#0057A8]" /> Yes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="prior_olympic" value="no" data-tab="4"
              checked={priorOlympic === "no"} onChange={() => setPriorOlympic("no")} className="accent-[#0057A8]" /> No
          </label>
        </div>
      </div>

      {priorOlympic === "yes" && (
        <div className="pl-6 border-l-2 border-blue-200 space-y-4">
          <div>
            <label htmlFor="prior_olympic_years" className={LABEL}>Which years?</label>
            <input id="prior_olympic_years" name="prior_olympic_years" type="text" data-tab="4"
              defaultValue={prefill?.priorOlympicYears ?? ""} placeholder="e.g. 2016, 2020, 2024" className={INPUT} />
          </div>
          <div>
            <label htmlFor="past_coverage_examples" className={LABEL}>Examples of past Games coverage</label>
            <textarea id="past_coverage_examples" name="past_coverage_examples" rows={3} data-tab="4"
              defaultValue={prefill?.pastCoverageExamples ?? ""}
              placeholder="Include links to published articles, photo galleries, or broadcasts from previous Olympic Games"
              className={`${INPUT} resize-none`} />
            <p className={HELP}>Links to published work are strongly encouraged</p>
          </div>
        </div>
      )}

      {/* Paralympic history */}
      <div>
        <label className={LABEL}>Has your organisation received Paralympic accreditation in the past?</label>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="prior_paralympic" value="yes" data-tab="4"
              checked={priorParalympic === "yes"} onChange={() => setPriorParalympic("yes")} className="accent-[#0057A8]" /> Yes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="prior_paralympic" value="no" data-tab="4"
              checked={priorParalympic === "no"} onChange={() => setPriorParalympic("no")} className="accent-[#0057A8]" /> No
          </label>
        </div>
      </div>

      {priorParalympic === "yes" && (
        <div className="pl-6 border-l-2 border-blue-200 space-y-4">
          <div>
            <label htmlFor="prior_paralympic_years" className={LABEL}>Which years?</label>
            <input id="prior_paralympic_years" name="prior_paralympic_years" type="text" data-tab="4"
              defaultValue={prefill?.priorParalympicYears ?? ""} placeholder="e.g. 2016, 2020, 2024" className={INPUT} />
          </div>
        </div>
      )}

      {/* No prior accreditation — tell us about other coverage */}
      {noPrior && (
        <div className="pl-6 border-l-2 border-gray-200">
          <label htmlFor="past_coverage_fallback" className={LABEL}>
            What sporting events does your organisation regularly cover?
          </label>
          <textarea id="past_coverage_fallback" name="past_coverage_examples" rows={3} data-tab="4"
            defaultValue={prefill?.pastCoverageExamples ?? ""}
            placeholder="Describe the sporting events, leagues, or competitions your organisation covers. Include any major international events."
            className={`${INPUT} resize-none`} />
        </div>
      )}

      {/* Additional comments */}
      <div className="border-t border-gray-100 pt-6">
        <label htmlFor="additional_comments" className={LABEL}>Additional comments</label>
        <textarea id="additional_comments" name="additional_comments" rows={3} data-tab="4"
          defaultValue={prefill?.additionalComments ?? ""}
          placeholder="Anything else you'd like your NOC to know about your application?"
          className={`${INPUT} resize-none`} />
      </div>
    </div>
  );
}
