"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { submitApplication, checkNocWindow } from "../actions";
import { OrganisationTab } from "./tabs/OrganisationTab";
import { ContactsTab } from "./tabs/ContactsTab";
import { AccreditationTab } from "./tabs/AccreditationTab";
import { PublicationTab } from "./tabs/PublicationTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { COUNTRY_TO_NOC, NOC_CODE_SET } from "@/lib/codes";

export type FormErrors = Record<string, string>;

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
  publicationTypeOther?: string | null;
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
  const tabListRef = useRef<HTMLDivElement>(null);
  const [tabStatus, setTabStatus] = useState<("empty" | "partial" | "complete")[]>(
    TABS.map(() => "empty")
  );
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [errorAnnouncement, setErrorAnnouncement] = useState("");
  const [nocWindowClosed, setNocWindowClosed] = useState(false);
  const [nocAutoSuggestedName, setNocAutoSuggestedName] = useState<string | null>(null);
  const autoSuggestedNocRef = useRef<string | null>(null);

  const STATUS_LABELS: Record<string, string> = {
    empty: "Not started",
    partial: "Partially filled",
    complete: "Complete",
  };

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
          } else {
            // Covers text, url, hidden (prior_olympic_years, prior_paralympic_years, publication_type_other, etc.)
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

  // Keys that may appear multiple times in FormData and should be joined with commas
  const MULTI_VALUE_KEYS = new Set(["publication_types"]);

  const handleInput = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (!formRef.current) return;
      const fd = new FormData(formRef.current);
      const data: Record<string, string> = {};
      for (const [key, val] of fd.entries()) {
        if (key === "token" || key === "email" || key === "resubmit_id") continue;
        if (MULTI_VALUE_KEYS.has(key)) {
          // Collect all checked values
          data[key] = (data[key] ? data[key] + "," : "") + String(val);
        } else {
          // For hidden inputs (prior_olympic_years, prior_paralympic_years) this picks up
          // the comma-joined value from the hidden input directly — no special handling needed
          data[key] = String(val);
        }
      }
      try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* full */ }
      updateTabStatus();
    }, 500);
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function handleCountryChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.name !== "country") return;

    const countryCode = target.value.split(" — ")[0].trim().toUpperCase();
    const suggestedNocCode = COUNTRY_TO_NOC[countryCode];
    if (!suggestedNocCode) return;

    const nocInput = formRef.current?.elements.namedItem("noc_code") as HTMLInputElement | null;
    if (!nocInput) return;

    // Only auto-fill if empty or if it was previously auto-suggested
    if (!nocInput.value || nocInput.value === autoSuggestedNocRef.current) {
      const nocEntry = nocCodes.find((n) => n.code === suggestedNocCode);
      if (nocEntry) {
        const newVal = `${nocEntry.code} — ${nocEntry.name}`;
        nocInput.value = newVal;
        autoSuggestedNocRef.current = newVal;
        setNocAutoSuggestedName(nocEntry.name);
        updateTabStatus();
      }
    }
  }

  async function handleFormBlur(e: React.FocusEvent<HTMLFormElement>) {
    const target = e.target as unknown as HTMLInputElement;
    if (target.name !== "noc_code") return;
    const raw = target.value.trim();
    // If the user changed the NOC from what was auto-suggested, clear the indicator
    if (raw !== autoSuggestedNocRef.current) setNocAutoSuggestedName(null);
    if (!raw) { setNocWindowClosed(false); return; }
    const nocCode = raw.split(" — ")[0].trim().toUpperCase();
    if (!NOC_CODE_SET.has(nocCode)) return;
    const { closed } = await checkNocWindow(nocCode);
    setNocWindowClosed(closed);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = formRef.current;
    if (!form) return;

    const errs: FormErrors = {};

    // Validate all required non-checkbox fields in DOM order (which == tab order)
    const requiredEls = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input[required]:not([type='checkbox']), select[required], textarea[required]"
      )
    );
    for (const el of requiredEls) {
      const empty = el instanceof HTMLSelectElement ? !el.value : !el.value.trim();
      if (empty) errs[el.name] = "This field is required.";
    }

    // Custom: at least one category checkbox must be checked
    const catChecked = Array.from(
      form.querySelectorAll<HTMLInputElement>('input[name^="category_"]')
    ).some((cb) => cb.checked);
    if (!catChecked) errs["category"] = "Please select at least one accreditation category.";

    // Validate URL fields (type="url" browser validation is bypassed by preventDefault)
    const urlInputs = form.querySelectorAll<HTMLInputElement>('input[type="url"]');
    for (const input of urlInputs) {
      if (input.value && !input.value.match(/^https?:\/\/.+\..+/)) {
        errs[input.name] = "Please enter a valid URL (e.g. https://www.example.com)";
      }
    }

    if (Object.keys(errs).length === 0) {
      setFieldErrors({});
      setErrorAnnouncement("");
      return; // valid — let the form action proceed
    }

    e.preventDefault();
    setFieldErrors(errs);

    // Navigate to the tab containing the first error
    const firstErrEl = requiredEls.find((el) => errs[el.name]) ?? null;
    const firstErrTab = firstErrEl
      ? parseInt(firstErrEl.getAttribute("data-tab") ?? "0", 10)
      : errs["category"] ? 2 : 0;
    setActiveTab(firstErrTab);

    const errCount = Object.keys(errs).length;
    setErrorAnnouncement(`${errCount} error${errCount > 1 ? "s" : ""} found. Please review your answers starting on the ${TABS[firstErrTab].label} tab.`);

    // After React re-renders the correct tab, scroll to + focus first invalid field
    setTimeout(() => {
      const target: HTMLElement | null =
        firstErrEl ??
        form.querySelector<HTMLElement>('[name^="category_"]');
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus();
    }, 60);
  }

  return (
    <>
      {/* How does this work? collapsible intro */}
      <details className="mb-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
        <summary className="px-5 py-3.5 text-sm font-medium text-[#0057A8] cursor-pointer select-none hover:bg-gray-50 flex items-center gap-2">
          <span className="text-base leading-none">ℹ️</span> How does this work?
        </summary>
        <div className="px-5 py-4 border-t border-gray-100 text-sm text-gray-700 space-y-2">
          <p>
            <strong>This is an Expression of Interest (EoI)</strong>, not a final accreditation decision.
            Submitting does not guarantee press credentials for LA 2028.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>Your <strong>National Olympic Committee (NOC)</strong> reviews your organisation&apos;s eligibility and approves or declines your EoI.</li>
            <li>If approved, your NOC enters a <strong>Press by Numbers (PbN)</strong> phase where slot quantities are negotiated with the IOC.</li>
            <li>Final accreditation decisions are made by the IOC and communicated via your NOC.</li>
            <li>You will be <strong>notified by email</strong> at each stage of the process.</li>
          </ul>
        </div>
      </details>

    {nocWindowClosed && (
      <div className="mb-4 p-4 bg-orange-50 border border-orange-300 rounded-lg" role="alert">
        <div className="text-sm font-semibold text-orange-800 mb-1">EoI window closed</div>
        <p className="text-sm text-orange-700">
          This NOC has closed its Expression of Interest window. New applications are not currently being accepted.
          Please contact your NOC directly for more information.
        </p>
      </div>
    )}

    <form ref={formRef} action={submitApplication} onInput={handleInput} onChange={(e) => handleCountryChange(e.nativeEvent)} onBlur={handleFormBlur} onSubmit={handleSubmit} className="space-y-0">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
      {resubmitId && <input type="hidden" name="resubmit_id" value={resubmitId} />}

      {/* Error summary live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{errorAnnouncement}</div>

      {/* Tab bar */}
      <div className="bg-white border border-gray-200 rounded-t-lg overflow-hidden">
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Application form sections"
          className="flex overflow-x-auto"
          onKeyDown={(e) => {
            let next = activeTab;
            if (e.key === "ArrowRight") next = (activeTab + 1) % TABS.length;
            else if (e.key === "ArrowLeft") next = (activeTab - 1 + TABS.length) % TABS.length;
            else if (e.key === "Home") next = 0;
            else if (e.key === "End") next = TABS.length - 1;
            else return;
            e.preventDefault();
            setActiveTab(next);
            const btn = tabListRef.current?.querySelector(`[id="eoi-tab-${next}"]`) as HTMLElement | null;
            btn?.focus();
          }}
        >
          {TABS.map((tab, i) => {
            const active = activeTab === i;
            const status = tabStatus[i];
            return (
              <button
                key={i}
                id={`eoi-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`eoi-panel-${i}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  active
                    ? "border-[#0057A8] text-[#0057A8] bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {/* Status dot */}
                <span aria-hidden="true" className={`w-2 h-2 rounded-full shrink-0 ${
                  status === "complete" ? "bg-green-500" :
                  status === "partial"  ? "bg-[#0057A8]" :
                  "bg-gray-300"
                }`} />
                {tab.label}
                <span className="sr-only">({STATUS_LABELS[status]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab panels — all rendered, only active visible */}
      <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-8">
        <div id="eoi-panel-0" role="tabpanel" aria-labelledby="eoi-tab-0" hidden={activeTab !== 0}>
          <OrganisationTab prefill={prefill} isResubmission={isResubmission} countryCodes={countryCodes} nocCodes={nocCodes} errors={fieldErrors} nocAutoSuggestedName={nocAutoSuggestedName} />
        </div>
        <div id="eoi-panel-1" role="tabpanel" aria-labelledby="eoi-tab-1" hidden={activeTab !== 1}>
          <ContactsTab prefill={prefill} email={email} errors={fieldErrors} />
        </div>
        <div id="eoi-panel-2" role="tabpanel" aria-labelledby="eoi-tab-2" hidden={activeTab !== 2}>
          <AccreditationTab prefill={prefill} errors={fieldErrors} />
        </div>
        <div id="eoi-panel-3" role="tabpanel" aria-labelledby="eoi-tab-3" hidden={activeTab !== 3}>
          <PublicationTab prefill={prefill} />
        </div>
        <div id="eoi-panel-4" role="tabpanel" aria-labelledby="eoi-tab-4" hidden={activeTab !== 4}>
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
    </>
  );
}
