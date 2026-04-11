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

/** Serialize visited tab indices to a JSON string for localStorage. */
export function serializeVisited(visited: Set<number>): string {
  return JSON.stringify([...visited].sort((a, b) => a - b));
}

/** Deserialize visited tab indices from a localStorage string. Returns empty set on error. */
export function deserializeVisited(raw: string | null): Set<number> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is number => typeof x === "number"));
  } catch {
    return new Set();
  }
}

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

// Fields beyond required that must be filled for a "full" (checkmark) status.
// Accreditation and History use custom DOM logic in isTabFull — listed here for reference only.
const CHECKMARK_FIELDS: Record<number, string[]> = {
  0: ["website"],
  1: ["contact_title", "contact_phone", "contact_cell"],
  2: [], // handled in isTabFull (requested_* per checked category)
  3: ["circulation", "publication_frequency", "sports_to_cover"],
  4: [], // handled in isTabFull (prior_olympic, prior_paralympic, past_coverage_examples)
};

export function EoiFormTabs({
  token,
  email,
  resubmitId,
  prefill,
  isResubmission,
  isFromInvite = false,
  countryCodes,
  nocCodes,
}: {
  token: string;
  email: string;
  resubmitId: string | null;
  prefill: PrefillData | null;
  isResubmission: boolean;
  isFromInvite?: boolean;
  countryCodes: { code: string; name: string }[];
  nocCodes: { code: string; name: string }[];
}) {
  const [activeTab, setActiveTab] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const [tabStatus, setTabStatus] = useState<("empty" | "complete" | "full")[]>(
    TABS.map(() => "empty")
  );
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [errorAnnouncement, setErrorAnnouncement] = useState("");
  const [nocWindowClosed, setNocWindowClosed] = useState(false);
  const [nocAutoSuggestedName, setNocAutoSuggestedName] = useState<string | null>(null);
  const autoSuggestedNocRef = useRef<string | null>(null);
  const confirmedRef = useRef(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalSummary, setModalSummary] = useState<{
    orgName: string;
    categories: string[];
    contactName: string;
    contactEmail: string;
  } | null>(null);
  const visitedTabsRef = useRef<Set<number>>(new Set());
  const [visitedTabs, setVisitedTabs] = useState<Set<number>>(new Set());

  const STATUS_LABELS: Record<string, string> = {
    empty: "Not started",
    complete: "Required fields complete",
    full: "Fully complete",
  };

  // localStorage keys scoped to this email
  const storageKey = `eoi-draft-${email}`;
  const visitedKey = `eoi-visited-${email}`;

  const markVisited = useCallback((tabIndex: number) => {
    if (visitedTabsRef.current.has(tabIndex)) return;
    visitedTabsRef.current = new Set(visitedTabsRef.current).add(tabIndex);
    setVisitedTabs(new Set(visitedTabsRef.current));
    try {
      localStorage.setItem(visitedKey, serializeVisited(visitedTabsRef.current));
    } catch { /* storage full */ }
  }, [visitedKey]);

  function isTabFull(tabIndex: number, form: HTMLFormElement): boolean {
    // Check standard extra fields first
    const extraFields = CHECKMARK_FIELDS[tabIndex] ?? [];
    for (const name of extraFields) {
      const el = form.elements.namedItem(name);
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        if (!el.value.trim()) return false;
      }
    }

    // Tab-specific custom checks
    if (tabIndex === 2) {
      // All checked categories must have a quantity filled
      const categories = ["E", "Es", "EP", "EPs", "ET", "EC"];
      for (const cat of categories) {
        const checkbox = form.elements.namedItem(`category_${cat}`) as HTMLInputElement | null;
        if (checkbox?.checked) {
          const qty = form.elements.namedItem(`requested_${cat}`) as HTMLInputElement | null;
          if (!qty?.value.trim()) return false;
        }
      }
      return true;
    }

    if (tabIndex === 3) {
      // At least one publication type must be checked
      const pubTypes = form.querySelectorAll<HTMLInputElement>('input[name="publication_types"]:checked');
      if (pubTypes.length === 0) return false;
    }

    if (tabIndex === 4) {
      // Both prior accreditation radios must be answered
      const olympicInputs = form.elements.namedItem("prior_olympic");
      const paralympicInputs = form.elements.namedItem("prior_paralympic");
      const olympicAnswered = olympicInputs instanceof RadioNodeList
        ? Array.from(olympicInputs).some((el) => el instanceof HTMLInputElement && el.checked)
        : false;
      const paralympicAnswered = paralympicInputs instanceof RadioNodeList
        ? Array.from(paralympicInputs).some((el) => el instanceof HTMLInputElement && el.checked)
        : false;
      if (!olympicAnswered || !paralympicAnswered) return false;
      // If the coverage textarea is in the DOM (shown when olympic=yes or both=no), it must be filled
      const coverage = form.elements.namedItem("past_coverage_examples");
      if (coverage instanceof HTMLTextAreaElement && !coverage.value.trim()) return false;
    }

    return true;
  }

  // Restore from localStorage on mount (skip for resubmissions and invite arrivals)
  useEffect(() => {
    if (isResubmission || isFromInvite || !formRef.current) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
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
      }
    } catch { /* ignore corrupt localStorage */ }

    // Restore visited tabs — always runs, independent of whether a draft exists
    const savedVisited = localStorage.getItem(visitedKey);
    const restoredVisited = deserializeVisited(savedVisited);
    visitedTabsRef.current = restoredVisited;
    setVisitedTabs(restoredVisited);

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
    const newStatus = TABS.map((_, tabIndex): "empty" | "complete" | "full" => {
      // Resubmission: org tab is read-only and fully pre-filled
      if (isResubmission && tabIndex === 0) return "full";

      // Must be visited first
      if (!visitedTabsRef.current.has(tabIndex)) return "empty";

      const required = REQUIRED_FIELDS[tabIndex] ?? [];

      // Check required fields
      const allRequired = required.every((name) => {
        const el = form.elements.namedItem(name);
        if (!el) return false;
        if (el instanceof RadioNodeList) {
          return Array.from(el).some(
            (item) => item instanceof HTMLInputElement && item.checked
          );
        }
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          return el.value.trim() !== "";
        }
        return false;
      });

      // Accreditation tab: at least one category checkbox required
      if (tabIndex === 2) {
        const catChecked = Array.from(
          form.querySelectorAll<HTMLInputElement>('input[name^="category_"]')
        ).some((cb) => cb.checked);
        if (!catChecked || !allRequired) return "empty";
      } else if (!allRequired) {
        return "empty";
      }

      // All required fields satisfied — check for full completion
      return isTabFull(tabIndex, form) ? "full" : "complete";
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
      // If triggered from a non-last tab (e.g. Enter key), advance one tab instead of submitting
      if (activeTab < TABS.length - 1) {
        e.preventDefault();
        setActiveTab(activeTab + 1);
        return;
      }
      // If already confirmed by the modal, let the form action proceed
      if (confirmedRef.current) {
        confirmedRef.current = false;
        return;
      }
      // Otherwise show the confirmation modal first
      e.preventDefault();
      const catMap: Record<string, string> = {
        category_e: "E", category_es: "Es", category_ep: "EP",
        category_eps: "EPs", category_et: "ET", category_ec: "EC",
      };
      const categories: string[] = [];
      for (const [name, label] of Object.entries(catMap)) {
        const cb = form.elements.namedItem(name) as HTMLInputElement | null;
        if (cb?.checked) categories.push(label);
      }
      const firstEl = form.elements.namedItem("contact_first_name") as HTMLInputElement | null;
      const lastEl  = form.elements.namedItem("contact_last_name")  as HTMLInputElement | null;
      const orgEl   = form.elements.namedItem("org_name")           as HTMLInputElement | null;
      setModalSummary({
        orgName:      orgEl?.value ?? "",
        categories,
        contactName:  [firstEl?.value, lastEl?.value].filter(Boolean).join(" "),
        contactEmail: email,
      });
      setShowConfirmModal(true);
      return;
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
                onClick={() => { markVisited(i); setActiveTab(i); }}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  active
                    ? "border-[#0057A8] text-[#0057A8] bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {/* Status indicator */}
                {status === "full" ? (
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4 shrink-0 text-green-500"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="8" cy="8" r="7" />
                    <polyline points="5,8.5 7,10.5 11,6.5" />
                  </svg>
                ) : (
                  <span aria-hidden="true" className={`w-2 h-2 rounded-full shrink-0 ${
                    status === "complete" ? "bg-green-500" : "bg-gray-300"
                  }`} />
                )}
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
              onClick={() => { markVisited(activeTab); setActiveTab(activeTab - 1); }}
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
              onClick={() => { markVisited(activeTab); setActiveTab(activeTab + 1); }}
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

    {/* Pre-submission confirmation modal */}
    {showConfirmModal && modalSummary && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <h2 id="confirm-modal-title" className="text-lg font-bold text-gray-900 mb-1">
            {isResubmission ? "Confirm resubmission" : "Confirm submission"}
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            {isResubmission
              ? "Your corrected application will be sent back to your NOC for review."
              : "Your application will be sent to your NOC for review. You won't be able to edit it until your NOC returns it."}
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2 mb-6">
            <div>
              <span className="text-gray-500">Organisation</span>
              <span className="ml-2 font-medium text-gray-900">{modalSummary.orgName}</span>
            </div>
            <div>
              <span className="text-gray-500">Categories</span>
              <span className="ml-2 font-medium text-gray-900">{modalSummary.categories.join(", ")}</span>
            </div>
            <div>
              <span className="text-gray-500">Contact</span>
              <span className="ml-2 font-medium text-gray-900">
                {modalSummary.contactName} · {modalSummary.contactEmail}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Go back
            </button>
            <button
              type="button"
              onClick={() => {
                confirmedRef.current = true;
                setShowConfirmModal(false);
                formRef.current?.requestSubmit();
              }}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors cursor-pointer"
            >
              {isResubmission ? "Confirm resubmit" : "Confirm & submit"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
