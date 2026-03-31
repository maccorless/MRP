"use client";

import { useState } from "react";
import type { PrefillData } from "../EoiFormTabs";
import { ACCRED_CATEGORIES, type AccredCategory } from "@/lib/category";

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const HELP = "text-xs text-gray-400 mt-1";

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-1.5 align-middle">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold leading-none flex items-center justify-center hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0057A8] cursor-pointer"
        aria-label="More information"
      >
        i
      </button>
      {open && (
        <div className="absolute z-10 left-5 top-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-600 leading-relaxed">
          {text}
        </div>
      )}
    </span>
  );
}

export function AccreditationTab({ prefill }: { prefill: PrefillData | null }) {
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

  const [selected, setSelected] = useState<Record<AccredCategory, boolean>>(initSelected);

  const toggle = (cat: AccredCategory) =>
    setSelected((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const anySelected = Object.values(selected).some(Boolean);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        Select every accreditation category your team requires. You may select more than one.
        Your NOC has a limited quota per category assigned by the IOC — the quantities you
        request here help your NOC plan allocations across all applicant organisations.
      </div>

      {/* Category checkboxes */}
      <div>
        <label className={LABEL}>
          Accreditation categories <span className="text-red-500">*</span>
        </label>
        <p className={`${HELP} mb-3`}>Select all that apply to your organisation.</p>
        <div className="space-y-2">
          {ACCRED_CATEGORIES.map((cat) => {
            const isChecked = selected[cat.value];
            return (
              <div
                key={cat.value}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  isChecked
                    ? "border-[#0057A8] bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => toggle(cat.value)}
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
                    onClick={(e) => e.stopPropagation()}
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
                  <div className="mt-3 ml-7" onClick={(e) => e.stopPropagation()}>
                    <label
                      htmlFor={`requested_${cat.value}`}
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      How many {cat.shortLabel} accreditations are you requesting?{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={`requested_${cat.value}`}
                      name={`requested_${cat.value}`}
                      type="number"
                      min={1}
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
                      placeholder="e.g. 3"
                      className="w-32 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!anySelected && (
          <p className="mt-2 text-xs text-red-500">Please select at least one accreditation category.</p>
        )}
      </div>

      {/* NOC E note */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
        <span className="font-medium text-gray-700">NOC E (Press Attaché)</span> accreditations are
        not available through this form. They are nominated directly by your National Olympic Committee
        and do not count against the standard E quota. Contact your NOC if this applies to your team.
      </div>

      {/* About coverage */}
      <div>
        <label htmlFor="about" className={LABEL}>
          About your coverage <span className="text-red-500">*</span>
        </label>
        <textarea
          id="about"
          name="about"
          required
          rows={5}
          data-tab="2"
          defaultValue={prefill?.about ?? ""}
          placeholder="Describe your organisation's editorial focus, the events and sports you plan to cover, the size of your on-site team, and any specific venue access requirements."
          className={`${INPUT} resize-none`}
        />
        <p className={HELP}>
          Be specific. Your NOC uses this to evaluate and prioritise your request. Include
          details about your audience reach and how you plan to cover LA 2028.
        </p>
      </div>
    </div>
  );
}
