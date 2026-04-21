"use client";

import { useState } from "react";
import type { PrefillData, FormErrors } from "../EoiFormWizard";

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const HELP  = "text-xs text-gray-500 mt-1";

type Cat = {
  key: string;         // form field suffix, e.g. "E", "Es", "ENR"
  code: string;        // display code, e.g. "E", "Es", "ENR"
  title: string;       // short title
  description: string; // longer description
  max: number;         // 100 or 3
};

// All 7 categories from the Excel spec, in order. Copy aligned to IOC wording
// supplied by Emma Morris on 2026-04-21.
const CATEGORIES: Cat[] = [
  {
    key: "E",
    code: "E",
    title: "Journalist",
    description: "Reporter, editor or photographic editor employed or contracted by a world news agency, national news agency, daily newspaper, sports daily, magazine, website or independent/freelance journalist.",
    max: 100,
  },
  {
    key: "Es",
    code: "Es",
    title: "Sport-Specific Journalist",
    description: "Journalist specialising in a sport on the Olympic Games programme meeting the same criteria as defined for category 'E'. Es accreditations include access to all disciplines of that sport.",
    max: 100,
  },
  {
    key: "EP",
    code: "EP",
    title: "Photographer",
    description: "Photographer, meeting the same criteria as defined for category 'E'.",
    max: 100,
  },
  {
    key: "EPs",
    code: "EPs",
    title: "Sport-Specific Photographer",
    description: "Photographer specialising in a sport on the Olympic Games programme meeting the same criteria as defined for category 'EP'. EPs accreditations include access to all disciplines of that sport.",
    max: 100,
  },
  {
    key: "EC",
    code: "Ec",
    title: "Support Staff",
    description: "Support staff of an accredited press organisation. (Office assistant, secretary, interpreter, etc). Access to the Main Press Centre only. Assigned only to an accredited press organisation or NOC with a private MPC office.",
    max: 100,
  },
  {
    key: "ET",
    code: "ET",
    title: "Technician",
    description: "Technician meeting the same criteria as defined for category 'E'. ET accreditations are limited to technical support personnel of major news agencies, organisations and/or photo agencies only and are generally identified by those organisations that rent Rate Card and telecommunications equipment at the MPC and competition venues.",
    max: 100,
  },
  {
    key: "ENR",
    code: "ENR",
    title: "Non-Media Rights-Holding Organisation",
    description: "Non-media rights holding radio and/or television organisation. ENR accreditations are granted by the National Olympic Committees but in close consultation with the IOC. Please refer to the exact process on www.olympics.com. The numbers of ENR accreditations are very limited. ENR accreditations are allocated only by the IOC in consultation with the NOC. Max 3.",
    max: 3,
  },
];

function initialValue(key: string, prefill: PrefillData | null): string {
  if (!prefill) return "0";
  const map: Record<string, number | null | undefined> = {
    E: prefill.requestedE,
    Es: prefill.requestedEs,
    EP: prefill.requestedEp,
    EPs: prefill.requestedEps,
    ET: prefill.requestedEt,
    EC: prefill.requestedEc,
    // ENR prefill is new; may not exist on older prefill shapes
  };
  const v = map[key];
  return typeof v === "number" ? String(v) : "0";
}

export function AccreditationStep({
  prefill,
  errors,
  orgType = "",
}: {
  prefill: PrefillData | null;
  errors?: FormErrors;
  orgType?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.key, initialValue(c.key, prefill)]))
  );
  const [aboutLength, setAboutLength] = useState<number>(prefill?.about?.length ?? 0);

  const totalRequested = Object.values(values).reduce((s, v) => s + (parseInt(v, 10) || 0), 0);
  const isNonMrh = orgType === "non_mrh";

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 leading-relaxed">
        Please complete the information below regarding the number / type of accreditations per
        category that your organisation wishes to receive. Be as accurate as possible — demand is
        high and each NOC receives a limited number of accreditations from the IOC.
        <br /><br />
        Each person can only hold one accreditation type at the Games (e.g. not both E and EP).
        Enter <b>0</b> for any category you are not requesting.
      </div>

      <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const enrLocked = cat.key === "ENR" && !isNonMrh;
          const numericValue = enrLocked ? "0" : values[cat.key];
          return (
            <div
              key={cat.key}
              className={`border border-gray-200 rounded-lg p-4 flex items-start gap-4 ${enrLocked ? "bg-gray-50" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-blue text-sm">{cat.code}</span>
                  <span className="font-medium text-gray-900">{cat.title}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{cat.description}</p>
                {enrLocked && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Only available to Non-MRH organisations. Set the organisation type to Non-MRH on the Organisation step to enable this category.
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <label htmlFor={`requested_${cat.key}`} className="block text-xs text-gray-500 mb-1 text-right">
                  Requested
                </label>
                <input
                  id={`requested_${cat.key}`}
                  name={`requested_${cat.key}`}
                  type="number"
                  min={0}
                  max={cat.max}
                  required
                  data-tab="2"
                  value={numericValue}
                  disabled={enrLocked}
                  onChange={(e) => {
                    const n = e.target.value;
                    setValues((prev) => ({ ...prev, [cat.key]: n }));
                  }}
                  className={`w-20 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent ${enrLocked ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`}
                />
                {parseInt(values[cat.key], 10) > cat.max && (
                  <p className="text-xs text-red-600 mt-1">
                    The value must be less than or equal to {cat.max}.
                  </p>
                )}
                {/* Hidden boolean that mirrors "is this requested" for backend compat */}
                <input
                  type="hidden"
                  name={`category_${cat.key}`}
                  value={(parseInt(numericValue, 10) || 0) > 0 ? "on" : ""}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalRequested === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          Please request at least one accreditation category (enter a value &gt; 0 for at least one row).
        </div>
      )}
      {errors?.category && (
        <p className="text-sm text-red-500" role="alert">{errors.category}</p>
      )}

      {/* Brief description — "about" */}
      <div className="border-t border-gray-100 pt-6">
        <label htmlFor="about" className={LABEL}>
          Brief description of your coverage plans for Los Angeles 2028 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="about" name="about" required rows={5} maxLength={500} data-tab="2"
          defaultValue={prefill?.about ?? ""}
          onChange={(e) => setAboutLength(e.target.value.length)}
          placeholder="Tell us how your organisation plans to cover LA 2028 — formats, platforms, audiences, standout angles."
          className={`${INPUT} resize-none ${errors?.about ? "border-red-500" : ""}`}
        />
        <p className="text-right text-xs text-gray-400 mt-1">{aboutLength} / 500</p>
        <p className={HELP}>500 characters max.</p>
        {errors?.about && <p className="text-xs text-red-500 mt-1" role="alert">{errors.about}</p>}
      </div>
    </div>
  );
}
