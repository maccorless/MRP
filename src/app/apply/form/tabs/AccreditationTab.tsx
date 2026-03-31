"use client";

import { useState } from "react";
import type { PrefillData } from "../EoiFormTabs";

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const HELP = "text-xs text-gray-400 mt-1";

const CATEGORIES = [
  { value: "press", label: "Press", desc: "Journalists, writers, reporters — covers written and digital editorial content" },
  { value: "photo", label: "Photo", desc: "Still photographers — accredited for photo positions at venues" },
  { value: "both", label: "Both — Press & Photo", desc: "Organisation will send both writers and photographers" },
] as const;

export function AccreditationTab({ prefill }: { prefill: PrefillData | null }) {
  const defaultCategory = prefill
    ? prefill.categoryPress && prefill.categoryPhoto
      ? "both"
      : prefill.categoryPress
      ? "press"
      : prefill.categoryPhoto
      ? "photo"
      : ""
    : "";

  const [category, setCategory] = useState(defaultCategory);
  const showPress = category === "press" || category === "both";
  const showPhoto = category === "photo" || category === "both";

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        Select the type of accreditation you are requesting and how many credentials your team will need.
        Your NOC has a limited quota of press and photo slots allocated by the IOC. The numbers you request
        here help your NOC plan allocations across all applicant organisations.
      </div>

      {/* Category selection */}
      <div>
        <label className={LABEL}>Accreditation category <span className="text-red-500">*</span></label>
        <div className="space-y-2 mt-2">
          {CATEGORIES.map(({ value, label, desc }) => (
            <label
              key={value}
              className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-[#0057A8] has-[:checked]:bg-blue-50 transition-colors"
            >
              <input
                type="radio"
                name="category"
                value={value}
                required
                checked={category === value}
                onChange={() => setCategory(value)}
                data-tab="2"
                className="mt-0.5 accent-[#0057A8]"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Conditional quantity inputs */}
      {(showPress || showPhoto) && (
        <div className="grid grid-cols-2 gap-4">
          {showPress && (
            <div>
              <label htmlFor="requested_press" className={LABEL}>
                Press accreditations requested <span className="text-red-500">*</span>
              </label>
              <input id="requested_press" name="requested_press" type="number" required min={1}
                defaultValue={prefill?.requestedPress ?? ""} placeholder="e.g. 3" data-tab="2" className={INPUT} />
              <p className={HELP}>Number of journalists/reporters your team will send</p>
            </div>
          )}
          {showPhoto && (
            <div>
              <label htmlFor="requested_photo" className={LABEL}>
                Photo accreditations requested <span className="text-red-500">*</span>
              </label>
              <input id="requested_photo" name="requested_photo" type="number" required min={1}
                defaultValue={prefill?.requestedPhoto ?? ""} placeholder="e.g. 2" data-tab="2" className={INPUT} />
              <p className={HELP}>Number of photographers your team will send</p>
            </div>
          )}
        </div>
      )}

      {/* About coverage */}
      <div>
        <label htmlFor="about" className={LABEL}>
          About your coverage <span className="text-red-500">*</span>
        </label>
        <textarea id="about" name="about" required rows={5} data-tab="2"
          defaultValue={prefill?.about ?? ""}
          placeholder="Describe your organisation's editorial focus, the events and sports you plan to cover, the size of your on-site team, and any specific venue access requirements."
          className={`${INPUT} resize-none`} />
        <p className={HELP}>
          Be specific. Your NOC uses this to evaluate and prioritise your request. Include details about your audience reach and how you plan to cover LA 2028.
        </p>
      </div>
    </div>
  );
}
