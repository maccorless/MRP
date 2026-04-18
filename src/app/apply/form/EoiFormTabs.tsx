"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { submitApplication, checkNocWindow } from "../actions";
import { OrganisationTab } from "./tabs/OrganisationTab";
import { ContactsTab } from "./tabs/ContactsTab";
import { AccreditationTab } from "./tabs/AccreditationTab";
import { PublicationTab } from "./tabs/PublicationTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { COUNTRY_TO_NOC, NOC_CODE_SET } from "@/lib/codes";
import { makeT, type Lang } from "@/lib/i18n";

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
  sportsSpecificSport?: string | null;
  about?: string;
  // New EoI re-engineering fields
  orgEmail?: string | null;
  orgTypeOther?: string | null;
  pressCard?: boolean | null;
  pressCardIssuer?: string | null;
  enrProgrammingType?: string | null;
  // Publication
  publicationTypes?: string[] | null;
  publicationTypeOther?: string | null;
  circulation?: string | null;
  publicationFrequency?: string | null;
  sportsToCover?: string | null;
  onlineUniqueVisitors?: string | null;
  geographicalCoverage?: string | null;
  socialMediaAccounts?: string | null;
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

// Tab definitions use translation keys; labels are resolved at render time.
const TAB_KEYS = [
  { key: "tabs.organisation" as const, icon: "1" },
  { key: "tabs.contacts"     as const, icon: "2" },
  { key: "tabs.accreditation" as const, icon: "3" },
  { key: "tabs.publication"  as const, icon: "4" },
  { key: "tabs.history"      as const, icon: "5" },
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
  0: ["website", "address", "city", "state_province", "postal_code"],
  1: [],
  2: [], // handled in isTabFull (requested_* per checked category)
  3: ["circulation", "publication_frequency", "sports_to_cover"],
  4: [], // handled in isTabFull (prior_olympic, prior_paralympic, past_coverage_examples)
};

// STATUS_LABELS are now derived from translations inside the component.

const MULTI_VALUE_KEYS = new Set(["publication_types"]);

function useModalEsc(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLDivElement | null>,
  onClose: () => void
) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    containerRef.current.querySelector<HTMLElement>("button")?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
}

export function EoiFormTabs({
  token,
  email,
  resubmitId,
  prefill,
  isResubmission,
  isPendingEdit = false,
  isFromInvite = false,
  countryCodes,
  nocCodes,
  lang = "en",
}: {
  token: string;
  email: string;
  resubmitId: string | null;
  prefill: PrefillData | null;
  isResubmission: boolean;
  isPendingEdit?: boolean;
  isFromInvite?: boolean;
  countryCodes: { code: string; name: string }[];
  nocCodes: { code: string; name: string }[];
  lang?: Lang;
}) {
  const t = makeT(lang);
  const TABS = TAB_KEYS.map((tab) => ({ label: t(tab.key), icon: tab.icon }));
  const [activeTab, setActiveTab] = useState(0);
  const [currentOrgType, setCurrentOrgType] = useState<string>(prefill?.orgType ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [tabStatus, setTabStatus] = useState<("empty" | "complete" | "full")[]>(
    TABS.map(() => "empty")
  );
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [errorAnnouncement, setErrorAnnouncement] = useState("");
  const [nocWindowClosed, setNocWindowClosed] = useState(false);
  const [nocAutoSuggestedName, setNocAutoSuggestedName] = useState<string | null>(null);
  const autoSuggestedNocRef = useRef<string | null>(null);
  const confirmedRef = useRef(false);
  const validationModalRef = useRef<HTMLDivElement>(null);
  const firstErrNameRef = useRef<string>("");
  const firstErrTabRef = useRef<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ tab: string; field: string }[]>([]);
  const [allTabsFull, setAllTabsFull] = useState(false);
  const [modalSummary, setModalSummary] = useState<{
    orgName: string;
    categories: string[];
    contactName: string;
    contactEmail: string;
  } | null>(null);
  const visitedTabsRef = useRef<Set<number>>(new Set());
  const [visitedTabs, setVisitedTabs] = useState<Set<number>>(new Set());

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
    if (tabIndex === 1) {
      // At least one of office phone or cell phone must be filled
      const phone = form.elements.namedItem("contact_phone") as HTMLInputElement | null;
      const cell  = form.elements.namedItem("contact_cell")  as HTMLInputElement | null;
      if (!phone?.value.trim() && !cell?.value.trim()) return false;
    }

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
    restoredVisited.add(0); // Tab 0 is the initial active tab — always visited
    visitedTabsRef.current = restoredVisited;
    setVisitedTabs(restoredVisited);

    updateTabStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useModalEsc(showConfirmModal, modalRef, () => setShowConfirmModal(false));
  useModalEsc(showValidationModal, validationModalRef, () => setShowValidationModal(false));

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
      const orgTypeEl = formRef.current?.elements.namedItem("org_type") as HTMLSelectElement | null;
      if (orgTypeEl) setCurrentOrgType(orgTypeEl.value);
    }, 500);
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateTabStatus() {
    if (!formRef.current) return;
    const form = formRef.current;
    const newStatus = TABS.map((_, tabIndex): "empty" | "complete" | "full" => {
      // Resubmission / pending-edit: org tab is read-only and fully pre-filled
      if ((isResubmission || isPendingEdit) && tabIndex === 0) return "full";

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
      } else if (tabIndex === 0) {
        const orgTypeEl = form.elements.namedItem("org_type") as HTMLSelectElement | null;
        if (orgTypeEl?.value === "freelancer") {
          const pressCard = form.elements.namedItem("press_card");
          const pressCardAnswered = pressCard instanceof RadioNodeList
            ? Array.from(pressCard).some((el) => el instanceof HTMLInputElement && el.checked)
            : false;
          if (!pressCardAnswered || !allRequired) return "empty";
        } else if (!allRequired) {
          return "empty";
        }
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

    // Confirmed path: the user approved the confirmation modal — let the server action run.
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }

    // All other paths: we own the outcome, so always prevent native submission.
    e.preventDefault();

    // Only validate and potentially submit from the last tab.
    // If triggered from any earlier tab (e.g. Enter key in a field), just advance.
    if (activeTab < TABS.length - 1) {
      setActiveTab(activeTab + 1);
      return;
    }

    // Gate: every tab must have at least a green dot before we accept submission.
    const incompleteTabs = TABS.reduce<{ tab: string; field: string }[]>((acc, tab, i) => {
      if (tabStatus[i] === "empty") acc.push({ tab: tab.label, field: t("validation.tabIncomplete") });
      return acc;
    }, []);
    if (incompleteTabs.length > 0) {
      setValidationErrors(incompleteTabs);
      const firstIncompleteTab = TABS.findIndex((_, i) => tabStatus[i] === "empty");
      firstErrTabRef.current = firstIncompleteTab >= 0 ? firstIncompleteTab : 0;
      firstErrNameRef.current = "";
      const errCount = incompleteTabs.length;
      setErrorAnnouncement(
        errCount === 1
          ? t("validation.tabsIncomplete.one")
          : t("validation.tabsIncomplete.many").replace("{n}", String(errCount))
      );
      setShowValidationModal(true);
      return;
    }

    const errs: FormErrors = {};

    // Validate all required non-checkbox fields in DOM order (which == tab order)
    const requiredEls = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input[required]:not([type='checkbox']), select[required], textarea[required]"
      )
    );
    const seenRadioGroups = new Set<string>();
    for (const el of requiredEls) {
      if (el instanceof HTMLInputElement && el.type === "radio") {
        if (seenRadioGroups.has(el.name)) continue;
        seenRadioGroups.add(el.name);
        const group = form.elements.namedItem(el.name) as RadioNodeList | null;
        const checked = group instanceof RadioNodeList
          ? Array.from(group).some((r) => r instanceof HTMLInputElement && r.checked)
          : false;
        if (!checked) errs[el.name] = t("validation.selectOption");
      } else {
        const empty = el instanceof HTMLSelectElement ? !el.value : !el.value.trim();
        if (empty) errs[el.name] = t("validation.required");
      }
    }

    // Custom: at least one category checkbox must be checked
    const catChecked = Array.from(
      form.querySelectorAll<HTMLInputElement>('input[name^="category_"]')
    ).some((cb) => cb.checked);
    if (!catChecked) errs["category"] = t("accred.categoryError");

    // Validate URL fields (type="url" browser validation is bypassed by noValidate)
    const urlInputs = form.querySelectorAll<HTMLInputElement>('input[type="url"]');
    for (const input of urlInputs) {
      if (input.value && input.value !== "https://" && !input.value.match(/^https?:\/\/.+\..+/)) {
        errs[input.name] = t("validation.url");
      }
    }

    if (Object.keys(errs).length === 0) {
      setFieldErrors({});
      setErrorAnnouncement("");
      const categories = ["E", "Es", "EP", "EPs", "ET", "EC"].filter((cat) => {
        const cb = form.elements.namedItem(`category_${cat}`) as HTMLInputElement | null;
        return cb?.checked;
      });
      const firstEl = form.elements.namedItem("contact_first_name") as HTMLInputElement | null;
      const lastEl  = form.elements.namedItem("contact_last_name")  as HTMLInputElement | null;
      const orgEl   = form.elements.namedItem("org_name")           as HTMLInputElement | null;
      setModalSummary({
        orgName:      orgEl?.value ?? "",
        categories,
        contactName:  [firstEl?.value, lastEl?.value].filter(Boolean).join(" "),
        contactEmail: email,
      });
      const allFull = tabStatus.every((s) => s === "full");
      setAllTabsFull(allFull);
      setShowConfirmModal(true);
      return;
    }

    setFieldErrors(errs);

    // Find first error element and tab — stored in refs for use when modal closes
    const firstErrEl = requiredEls.find((el) => errs[el.name]) ?? null;
    const firstErrTab = firstErrEl
      ? parseInt(firstErrEl.getAttribute("data-tab") ?? "0", 10)
      : errs["category"] ? 2 : 0;
    firstErrNameRef.current = firstErrEl?.name ?? "";
    firstErrTabRef.current = firstErrTab;

    // Build missing field list for the validation modal — read label text from DOM
    const errList = Object.keys(errs).map((name) => {
      const el = requiredEls.find((r) => r.name === name);
      const tabIndex = name === "category" ? 2
        : el ? parseInt(el.getAttribute("data-tab") ?? "0", 10) : 0;
      const labelEl = el?.id
        ? document.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`)
        : null;
      const fieldLabel = labelEl?.textContent?.replace(/\s*\*|\(optional\)/g, "").trim()
        ?? name.replace(/_/g, " ");
      return { tab: TABS[tabIndex]?.label ?? "Unknown", field: fieldLabel };
    });
    setValidationErrors(errList);

    const errCount = Object.keys(errs).length;
    setErrorAnnouncement(
      errCount === 1
        ? t("validation.fieldsIncomplete.one")
        : t("validation.fieldsIncomplete.many").replace("{n}", String(errCount))
    );
    setShowValidationModal(true);
  }

  function handleGoToFirstError() {
    setShowValidationModal(false);
    const tabIndex = firstErrTabRef.current;
    const errName = firstErrNameRef.current;
    flushSync(() => setActiveTab(tabIndex));
    const target = errName
      ? formRef.current?.querySelector<HTMLElement>(`[name="${errName}"]`)
      : formRef.current?.querySelector<HTMLElement>('[name^="category_"]');
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus();
  }

  function handleConfirmedSubmit() {
    confirmedRef.current = true;
    setShowConfirmModal(false);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(visitedKey);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      {/* How does this work? collapsible intro */}
      <details className="mb-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
        <summary className="px-5 py-3.5 text-sm font-medium text-[#0057A8] cursor-pointer select-none hover:bg-gray-50 flex items-center gap-2">
          <span className="text-base leading-none">ℹ️</span> {t("form.intro.summary")}
        </summary>
        <div className="px-5 py-4 border-t border-gray-100 text-sm text-gray-700 space-y-2">
          <p>
            <strong>{t("form.intro.heading")}</strong>{t("form.intro.heading.suffix")}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>{t("form.intro.bullet1")}</li>
            <li>{t("form.intro.bullet2")}</li>
            <li>{t("form.intro.bullet3")}</li>
            <li>{t("form.intro.bullet4")}</li>
          </ul>
        </div>
      </details>

    {nocWindowClosed && (
      <div className="mb-4 p-4 bg-orange-50 border border-orange-300 rounded-lg" role="alert">
        <div className="text-sm font-semibold text-orange-800 mb-1">{t("form.nocWindowClosed.heading")}</div>
        <p className="text-sm text-orange-700">
          {t("form.nocWindowClosed.body")}
        </p>
      </div>
    )}

    <form ref={formRef} action={submitApplication} noValidate onInput={handleInput} onChange={(e) => { handleCountryChange(e.nativeEvent); handleInput(); }} onBlur={handleFormBlur} onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && (e.target as HTMLElement).tagName !== "BUTTON") e.preventDefault(); }} className="space-y-0">
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
          aria-label={t("form.tablist.ariaLabel")}
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
                onClick={() => { markVisited(i); updateTabStatus(); setActiveTab(i); }}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  active
                    ? "border-[#0057A8] text-[#0057A8] bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {/* Status indicator — fixed 16px slot so tab width never shifts */}
                <span className="w-4 h-4 flex items-center justify-center shrink-0" aria-hidden="true">
                  {status === "full" ? (
                    <svg
                      className="w-4 h-4 text-green-500"
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
                    <span className={`w-2 h-2 rounded-full ${
                      status === "complete" ? "bg-green-500" : "bg-gray-300"
                    }`} />
                  )}
                </span>
                {tab.label}
                <span className="sr-only">({t(`tabs.status.${status}`)})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab panels — all rendered, only active visible */}
      <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-8">
        <div id="eoi-panel-0" role="tabpanel" aria-labelledby="eoi-tab-0" hidden={activeTab !== 0}>
          <OrganisationTab prefill={prefill} isResubmission={isResubmission} countryCodes={countryCodes} nocCodes={nocCodes} errors={fieldErrors} nocAutoSuggestedName={nocAutoSuggestedName} lang={lang} />
        </div>
        <div id="eoi-panel-1" role="tabpanel" aria-labelledby="eoi-tab-1" hidden={activeTab !== 1}>
          <ContactsTab prefill={prefill} email={email} errors={fieldErrors} lang={lang} />
        </div>
        <div id="eoi-panel-2" role="tabpanel" aria-labelledby="eoi-tab-2" hidden={activeTab !== 2}>
          <AccreditationTab prefill={prefill} errors={fieldErrors} orgType={currentOrgType} lang={lang} />
        </div>
        <div id="eoi-panel-3" role="tabpanel" aria-labelledby="eoi-tab-3" hidden={activeTab !== 3}>
          <PublicationTab prefill={prefill} lang={lang} />
        </div>
        <div id="eoi-panel-4" role="tabpanel" aria-labelledby="eoi-tab-4" hidden={activeTab !== 4}>
          <HistoryTab prefill={prefill} lang={lang} />
        </div>

        {/* Navigation + submit */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {activeTab > 0 ? (
            <button
              type="button"
              onClick={() => { markVisited(activeTab); updateTabStatus(); setActiveTab(activeTab - 1); }}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              {t("form.nav.back")}
            </button>
          ) : (
            <div />
          )}

          {activeTab < TABS.length - 1 ? (
            <button
              type="button"
              onClick={() => { markVisited(activeTab); markVisited(activeTab + 1); updateTabStatus(); setActiveTab(activeTab + 1); }}
              className="px-5 py-2.5 bg-[#0057A8] text-white text-sm font-semibold rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
            >
              {t("form.nav.continue")}
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition-colors cursor-pointer"
            >
              {isResubmission ? t("form.nav.resubmit") : isPendingEdit ? t("form.nav.saveChanges") : t("form.nav.submit")}
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        {t("form.autoSave")}
      </p>
    </form>

    {/* Validation errors modal */}
    {showValidationModal && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="validation-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      >
        <div ref={validationModalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <h2 id="validation-modal-title" className="text-lg font-bold text-gray-900 mb-1">
            {t("form.validationModal.title")}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {t("form.validationModal.subtitle")}
          </p>
          <ul role="list" aria-label={t("form.validationModal.title")} className="mb-5 space-y-1.5">
            {validationErrors.map((err) => (
              <li key={`${err.tab}:${err.field}`} className="text-sm text-gray-800">
                <span className="font-medium text-gray-500">{err.tab}:</span>{" "}
                {err.field}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleGoToFirstError}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-[#0057A8] rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
          >
            {t("form.validationModal.goToError")}
          </button>
        </div>
      </div>
    )}

    {/* Pre-submission confirmation modal */}
    {showConfirmModal && modalSummary && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      >
        <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <h2 id="confirm-modal-title" className="text-lg font-bold text-gray-900 mb-1">
            {isResubmission ? t("form.confirmModal.title.resubmit") : isPendingEdit ? t("form.confirmModal.title.edit") : t("form.confirmModal.title.submit")}
          </h2>
          <p id="confirm-modal-desc" className="text-sm text-gray-500 mb-5">
            {isResubmission
              ? t("form.confirmModal.desc.resubmit")
              : isPendingEdit
              ? t("form.confirmModal.desc.edit")
              : t("form.confirmModal.desc.submit")}
          </p>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2 mb-5">
            <div>
              <span className="text-gray-500">{t("form.confirmModal.summary.organisation")}</span>
              <span className="ml-2 font-medium text-gray-900">{modalSummary.orgName}</span>
            </div>
            <div>
              <span className="text-gray-500">{t("form.confirmModal.summary.categories")}</span>
              <span className="ml-2 font-medium text-gray-900">{modalSummary.categories.join(", ")}</span>
            </div>
            <div>
              <span className="text-gray-500">{t("form.confirmModal.summary.contact")}</span>
              <span className="ml-2 font-medium text-gray-900">
                {modalSummary.contactName} · {modalSummary.contactEmail}
              </span>
            </div>
          </div>

          {/* Nudge — shown only when optional fields are incomplete */}
          {!allTabsFull && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-5">
              <p className="font-semibold mb-1">{t("form.confirmModal.nudge.heading")}</p>
              <p>{t("form.confirmModal.nudge.body")}</p>
            </div>
          )}

          {/* CTAs */}
          <div className="flex gap-3">
            {allTabsFull ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t("form.confirmModal.goBack")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmedSubmit}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors cursor-pointer"
                >
                  {isResubmission ? t("form.confirmModal.confirmResubmit") : isPendingEdit ? t("form.confirmModal.saveChanges") : t("form.confirmModal.confirmSubmit")}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    const firstIncomplete = tabStatus.findIndex((s) => s !== "full");
                    if (firstIncomplete !== -1) setActiveTab(firstIncomplete);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t("form.confirmModal.addEdit")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmedSubmit}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors cursor-pointer"
                >
                  {t("form.confirmModal.submitApplication")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
