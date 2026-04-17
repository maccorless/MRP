"use client";

import { useState, useId } from "react";
import type { FormErrors, PrefillData } from "../EoiFormTabs";
import { ACCRED_CATEGORIES, type AccredCategory } from "@/lib/category";
import { LA28_SPORTS } from "@/lib/sports";

const BASE_INPUT = "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent";
const INPUT = BASE_INPUT + " border-gray-300";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const HELP = "text-xs text-gray-400 mt-1";

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  return (
    <span className="relative inline-block ml-1.5 align-middle">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold leading-none flex items-center justify-center hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0057A8] cursor-pointer"
        aria-label="More information"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
      >
        i
      </button>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute z-10 left-5 top-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-600 leading-relaxed"
        >
          {text}
        </div>
      )}
    </span>
  );
}

export function AccreditationTab({ prefill, errors, orgType }: { prefill: PrefillData | null; errors?: FormErrors; orgType?: string }) {
  // Initialise selected state from prefill
  const initSelected = (): Record<AccredCategory, boolean> => {
    if (!prefill) return { E: false, Es: false, EP: false, EPs: false, ET: false, EC: false };
    return {
      E:   prefill.categoryE ?? false,
      Es:  prefill.categoryEs ?? false,
      EP:  prefill.categoryEp ?? false,
      EPs: prefill.categoryEps ?? false,
      ET:  prefill.categoryEt ?? false,
      EC:  prefill.categoryEc ?? false,
    };
  };

  const initQuantities = (): Record<string, number> => ({
    E:   Number(prefill?.requestedE   ?? 0),
    Es:  Number(prefill?.requestedEs  ?? 0),
    EP:  Number(prefill?.requestedEp  ?? 0),
    EPs: Number(prefill?.requestedEps ?? 0),
    ET:  Number(prefill?.requestedEt  ?? 0),
    EC:  Number(prefill?.requestedEc  ?? 0),
  });

  const [selected, setSelected] = useState<Record<AccredCategory, boolean>>(initSelected);
  const [quantities, setQuantities] = useState<Record<string, number>>(initQuantities);
  const [aboutLength, setAboutLength] = useState<number>(prefill?.about?.length ?? 0);
  const [sportsSpecificSport, setSportsSpecificSport] = useState<string>(
    prefill?.sportsSpecificSport ?? ""
  );

  const toggle = (cat: AccredCategory) =>
    setSelected((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const anySelected = Object.values(selected).some(Boolean);
  const needsSportPicker = selected.Es || selected.EPs;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        Select every accreditation category your team requires. You may select more than one.
        Your NOC has a limited quota per category assigned by the IOC — the quantities you
        request here help your NOC plan allocations across all applicant organisations.
      </div>

      {/* Category checkboxes */}
      <fieldset>
        <legend className={LABEL}>
          Accreditation categories <span className="text-red-500" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </legend>
        <p className={`${HELP} mb-3`}>Select all that apply to your organisation.</p>
        <div className="space-y-2">
          {ACCRED_CATEGORIES.map((cat) => {
            const isChecked = selected[cat.value];
            return (
              <label
                key={cat.value}
                htmlFor={`category_${cat.value}`}
                className={`block border rounded-lg p-4 cursor-pointer transition-colors ${
                  isChecked
                    ? "border-[#0057A8] bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name={`category_${cat.value}`}
                    id={`category_${cat.value}`}
                    checked={isChecked}
                    onChange={() => toggle(cat.value)}
                    data-tab="2"
                    className="mt-0.5 accent-[#0057A8] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {cat.label}
                      </span>
                      <InfoTooltip text={cat.helpText} />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{cat.description}</div>
                  </div>
                </div>

                {/* Quantity input — shown when checked */}
                {isChecked && (
                  <div className="mt-3 ml-7" onClick={(e) => e.preventDefault()}>
                    <label
                      htmlFor={`requested_${cat.value}`}
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      How many {cat.shortLabel} accreditations are you requesting?{" "}
                      <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={`requested_${cat.value}`}
                      name={`requested_${cat.value}`}
                      type="number"
                      min={1}
                      max={orgType === "enr" ? 3 : 100}
                      required
                      data-tab="2"
                      defaultValue={
                        cat.value === "E"   ? (prefill?.requestedE   ?? "") :
                        cat.value === "Es"  ? (prefill?.requestedEs  ?? "") :
                        cat.value === "EP"  ? (prefill?.requestedEp  ?? "") :
                        cat.value === "EPs" ? (prefill?.requestedEps ?? "") :
                        cat.value === "ET"  ? (prefill?.requestedEt  ?? "") :
                        cat.value === "EC"  ? (prefill?.requestedEc  ?? "") : ""
                      }
                      onChange={(e) =>
                        setQuantities((prev) => ({ ...prev, [cat.value]: Number(e.target.value) }))
                      }
                      placeholder="e.g. 3"
                      className="w-32 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent"
                    />
                    {orgType === "enr" && quantities[cat.value] > 3 && (
                      <p className="text-xs text-red-600 mt-0.5">Maximum 3 for ENR organisations</p>
                    )}
                    {orgType !== "enr" && quantities[cat.value] > 100 && (
                      <p className="text-xs text-red-600 mt-0.5">Maximum 100 accreditations per category</p>
                    )}
                  </div>
                )}
              </label>
            );
          })}
        </div>
        {(errors?.category || !anySelected) && (
          <p id="err-category" className="mt-2 text-xs text-red-500" role="alert">
            {errors?.category ?? "Please select at least one accreditation category."}
          </p>
        )}
      </fieldset>

      {/* Sport picker — shown when Es or EPs is checked */}
      {needsSportPicker && (
        <div>
          <label htmlFor="sports_specific_sport" className={LABEL}>
            Which Olympic sport?{" "}
            <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only">(required for Es / EPs)</span>
          </label>
          <p className={`${HELP} mb-1`}>
            Required for Es / EPs — both categories cover the same sport.
          </p>
          <select
            id="sports_specific_sport"
            name="sports_specific_sport"
            value={sportsSpecificSport}
            onChange={(e) => setSportsSpecificSport(e.target.value)}
            required
            data-tab="2"
            className={INPUT}
          >
            <option value="">Select a sport…</option>
            {LA28_SPORTS.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* NOC E note */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
        <span className="font-medium text-gray-700">NOC E (Press Attaché)</span> accreditations are
        not available through this form. They are nominated directly by your National Olympic Committee
        and do not count against the standard E quota. Contact your NOC if this applies to your team.
      </div>

      {/* About coverage */}
      <div>
        <label htmlFor="about" className={LABEL}>
          Brief description of your coverage plans for Los Angeles 2028 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="about"
          name="about"
          required
          rows={5}
          maxLength={500}
          data-tab="2"
          defaultValue={prefill?.about ?? ""}
          onChange={(e) => setAboutLength(e.target.value.length)}
          placeholder="Describe your organisation's editorial focus, the events and sports you plan to cover, the size of your on-site team, and any specific venue access requirements."
          className={`${errors?.about ? BASE_INPUT + " border-red-500" : INPUT} resize-none`}
          aria-invalid={!!errors?.about}
          aria-describedby={errors?.about ? "err-about" : undefined}
        />
        <p className="text-right text-xs text-gray-400 mt-1">{aboutLength} / 500</p>
        {errors?.about && <p id="err-about" className="text-xs text-red-500 mt-1" role="alert">{errors.about}</p>}
        <p className={HELP}>
          Be specific. Your NOC uses this to evaluate and prioritise your request. Include
          details about your audience reach and how you plan to cover LA 2028.
        </p>
      </div>

      {/* ENR programming type — shown only for ENR organisations */}
      {orgType === "enr" && (
        <div className="mt-4">
          <label htmlFor="enr-programming-type" className="block text-xs font-medium text-gray-700 mb-1">
            Type of programming <span className="text-red-500">*</span>
          </label>
          <textarea
            id="enr-programming-type"
            name="enr_programming_type"
            rows={2}
            placeholder="e.g. news programme, sports programme, regional sports coverage"
            defaultValue={prefill?.enrProgrammingType ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">Required for ENR (Non-Media Rights Holder) applications.</p>
        </div>
      )}
    </div>
  );
}
