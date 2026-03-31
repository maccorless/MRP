"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { submitApplication } from "../actions";
import { OrganisationTab } from "./tabs/OrganisationTab";
import { ContactsTab } from "./tabs/ContactsTab";
import { AccreditationTab } from "./tabs/AccreditationTab";
import { PublicationTab } from "./tabs/PublicationTab";
import { HistoryTab } from "./tabs/HistoryTab";

export type PrefillData = {
  // Organization
  orgName?: string;
  orgWebsite?: string | null;
  orgType?: string;
  orgCountry?: string;
  orgNocCode?: string;
  // Contact
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactTitle?: string | null;
  contactPhone?: string | null;
  contactCell?: string | null;
  secondaryFirstName?: string | null;
  secondaryLastName?: string | null;
  secondaryTitle?: string | null;
  secondaryEmail?: string | null;
  secondaryPhone?: string | null;
  secondaryCell?: string | null;
  // Accreditation — per E-category flags
  categoryE?: boolean;
  categoryEs?: boolean;
  categoryEp?: boolean;
  categoryEps?: boolean;
  categoryEt?: boolean;
  categoryEc?: boolean;
  requestedE?: number | null;
  requestedEs?: number | null;
  requestedEp?: number | null;
  requestedEps?: number | null;
  requestedEt?: number | null;
  requestedEc?: number | null;
  about?: string;
  // Publication
  publicationTypes?: string[] | null;
  circulation?: string | null;
  publicationFrequency?: string | null;
  sportsToCover?: string | null;
  // History
  priorOlympic?: boolean | null;
  priorOlympicYears?: string | null;
  priorParalympic?: boolean | null;
  priorParalympicYears?: string | null;
  pastCoverageExamples?: string | null;
  additionalComments?: string | null;
  accessibilityNeeds?: boolean | null;
};

const TABS = [
  { label: "Organisation", icon: "1" },
  { label: "Contacts",     icon: "2" },
  { label: "Accreditation",icon: "3" },
  { label: "Publication",  icon: "4" },
  { label: "History",      icon: "5" },
];

// Required fields per tab (by input name)
const REQUIRED_FIELDS: Record<number, string[]> = {
  0: ["org_name", "org_type", "country", "noc_code"],
  1: ["contact_first_name", "contact_last_name"],
  2: ["about"],
  3: [],
  4: [],
};

export function EoiFormTabs({
  token,
  email,
  resubmitId,
  prefill,
  isResubmission,
  countryCodes,
  nocCodes,
}: {
  token: string;
  email: string;
  resubmitId: string | null;
  prefill: PrefillData | null;
  isResubmission: boolean;
  countryCodes: { code: string; name: string }[];
  nocCodes: { code: string; name: string }[];
}) {
  const [activeTab, setActiveTab] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [tabStatus, setTabStatus] = useState<("empty" | "partial" | "complete")[]>(
    TABS.map(() => "empty")
  );

  // localStorage key scoped to this email
  const storageKey = `eoi-draft-${email}`;

  // Restore from localStorage on mount (skip for resubmissions)
  useEffect(() => {
    if (isResubmission || !formRef.current) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const data = JSON.parse(saved) as Record<string, string>;
      const form = formRef.current;
      for (const [name, value] of Object.entries(data)) {
        const elements = form.elements.namedItem(name);
        if (!elements) continue;
        if (elements instanceof RadioNodeList) {
          for (const el of elements) {
            if (el instanceof HTMLInputElement && el.type === "radio") {
              el.checked = el.value === value;
            } else if (el instanceof HTMLInputElement && el.type === "checkbox") {
              el.checked = (data[name + "[]"] ?? "").includes(el.value);
            }
          }
        } else if (elements instanceof HTMLInputElement) {
          if (elements.type === "checkbox") {
            elements.checked = value === "true";
          } else if (elements.type !== "hidden") {
            elements.value = value;
          }
        } else if (elements instanceof HTMLTextAreaElement || elements instanceof HTMLSelectElement) {
          elements.value = value;
        }
      }
    } catch { /* ignore corrupt localStorage */ }
    updateTabStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save to localStorage on input (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleInput = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (!formRef.current) return;
      const fd = new FormData(formRef.current);
      const data: Record<string, string> = {};
      for (const [key, val] of fd.entries()) {
        if (key === "token" || key === "email" || key === "resubmit_id") continue;
        if (key === "publication_types") {
          // Collect all checked values
          data[key] = (data[key] ? data[key] + "," : "") + String(val);
        } else {
          data[key] = String(val);
        }
      }
      try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* full */ }
      updateTabStatus();
    }, 500);
  }, [storageKey]);

  function updateTabStatus() {
    if (!formRef.current) return;
    const form = formRef.current;
    const newStatus = TABS.map((_, tabIndex) => {
      const required = REQUIRED_FIELDS[tabIndex] ?? [];
      const tabFields = form.querySelectorAll(`[data-tab="${tabIndex}"]`);
      let anyFilled = false;

      tabFields.forEach((el) => {
        if (el instanceof HTMLInputElement) {
          if (el.type === "radio" && el.checked) anyFilled = true;
          else if (el.type === "checkbox" && el.checked) anyFilled = true;
          else if (el.type !== "radio" && el.type !== "checkbox" && el.value.trim()) anyFilled = true;
        } else if ((el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) && el.value.trim()) {
          anyFilled = true;
        }
      });

      if (!anyFilled) return "empty" as const;

      // Check if all required fields are filled
      if (isResubmission && tabIndex === 0) return "complete" as const; // org is read-only
      const allRequired = required.every((name) => {
        const el = form.elements.namedItem(name);
        if (!el) return tabIndex === 0 && isResubmission; // skip org fields on resubmit
        if (el instanceof RadioNodeList) {
          for (const item of el) {
            if (item instanceof HTMLInputElement && item.checked) return true;
          }
          return false;
        }
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
          return el.value.trim() !== "";
        }
        return false;
      });

      return allRequired ? "complete" as const : "partial" as const;
    });
    setTabStatus(newStatus);
  }

  return (
    <form ref={formRef} action={submitApplication} onInput={handleInput} className="space-y-0">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
      {resubmitId && <input type="hidden" name="resubmit_id" value={resubmitId} />}

      {/* Tab bar */}
      <div className="bg-white border border-gray-200 rounded-t-lg overflow-hidden">
        <div className="flex overflow-x-auto">
          {TABS.map((tab, i) => {
            const active = activeTab === i;
            const status = tabStatus[i];
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  active
                    ? "border-[#0057A8] text-[#0057A8] bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {/* Status dot */}
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  status === "complete" ? "bg-green-500" :
                  status === "partial"  ? "bg-[#0057A8]" :
                  "bg-gray-300"
                }`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab panels — all rendered, only active visible */}
      <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-8">
        <div className={activeTab === 0 ? "" : "hidden"}>
          <OrganisationTab prefill={prefill} isResubmission={isResubmission} countryCodes={countryCodes} nocCodes={nocCodes} />
        </div>
        <div className={activeTab === 1 ? "" : "hidden"}>
          <ContactsTab prefill={prefill} email={email} />
        </div>
        <div className={activeTab === 2 ? "" : "hidden"}>
          <AccreditationTab prefill={prefill} />
        </div>
        <div className={activeTab === 3 ? "" : "hidden"}>
          <PublicationTab prefill={prefill} />
        </div>
        <div className={activeTab === 4 ? "" : "hidden"}>
          <HistoryTab prefill={prefill} />
        </div>

        {/* Navigation + submit */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {activeTab > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {activeTab < TABS.length - 1 ? (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab + 1)}
              className="px-5 py-2.5 bg-[#0057A8] text-white text-sm font-semibold rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition-colors cursor-pointer"
            >
              {isResubmission ? "Resubmit Application" : "Submit Application"}
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        Your progress is saved automatically. By submitting you confirm this information is accurate.
      </p>
    </form>
  );
}
