"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { flushSync } from "react-dom";
import { submitApplication, checkNocWindow } from "../actions";
import { OrganisationTab } from "./tabs/OrganisationTab";
import { ContactsTab } from "./tabs/ContactsTab";
import { AccreditationTab } from "./tabs/AccreditationTab";
import { PublicationTab } from "./tabs/PublicationTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { COUNTRY_TO_NOC, NOC_CODE_SET } from "@/lib/codes";
import { Icon } from "@/components/Icon";
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

// Required fields per tab (by input name) — LA28 Apr 2026 Excel-aligned.
const REQUIRED_FIELDS: Record<number, string[]> = {
  0: [
    "org_name", "org_type", "website", "address", "city", "postal_code",
    "country", "noc_code", "org_phone", "org_email",
  ],
  1: ["contact_first_name", "contact_last_name", "contact_title", "contact_cell"],
  2: ["about"],
  3: [],
  4: ["prior_olympic", "past_coverage_examples"],
};

// With the Excel-aligned field set, "complete" and "full" are effectively the same:
// there are no optional-but-nudged fields beyond the required set. We keep this map
// empty so isTabFull simply checks the required fields (same as "complete").
const CHECKMARK_FIELDS: Record<number, string[]> = {
  0: [],
  1: [],
  2: [],
  3: [],
  4: [],
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
  const [isSubmitting, startSubmitTransition] = useTransition();
  const validationModalRef = useRef<HTMLDivElement>(null);
  const firstErrNameRef = useRef<string>("");
  const firstErrTabRef = useRef<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ tab: string; field: string }[]>([]);
  const [gdprAccepted, setGdprAccepted] = useState(false);
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
    // LA28 Apr 2026 Excel-aligned completeness — "complete" and "full" are equivalent.
    const extraFields = CHECKMARK_FIELDS[tabIndex] ?? [];
    for (const name of extraFields) {
      const el = form.elements.namedItem(name);
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        if (!el.value.trim()) return false;
      }
    }

    if (tabIndex === 0) {
      // Organisation: conditional fields based on org_type
      const orgTypeEl = form.elements.namedItem("org_type") as HTMLSelectElement | null;
      const orgTypeVal = orgTypeEl?.value ?? "";
      if (orgTypeVal === "other") {
        const other = form.elements.namedItem("org_type_other") as HTMLInputElement | null;
        if (!other?.value.trim()) return false;
      }
      if (orgTypeVal === "non_mrh") {
        const subtype = form.elements.namedItem("non_mrh_media_type") as HTMLSelectElement | null;
        if (!subtype?.value) return false;
        if (subtype.value === "other") {
          const spec = form.elements.namedItem("non_mrh_media_type_other") as HTMLInputElement | null;
          if (!spec?.value.trim()) return false;
        }
      }
    }

    if (tabIndex === 1) {
      // Contacts: Editor-in-Chief required unless freelance org type
      const orgTypeEl = form.elements.namedItem("org_type") as HTMLSelectElement | null;
      const orgTypeVal = orgTypeEl?.value ?? "";
      const isFreelance = orgTypeVal === "freelance_journalist" || orgTypeVal === "freelance_photographer" || orgTypeVal === "freelancer";
      if (!isFreelance) {
        for (const name of ["editor_in_chief_first_name", "editor_in_chief_last_name", "editor_in_chief_email"]) {
          const el = form.elements.namedItem(name) as HTMLInputElement | null;
          if (!el?.value.trim()) return false;
        }
      }
    }

    if (tabIndex === 2) {
      // Accreditation: at least one of E/Es/EP/EPs/ET/EC/ENR must be > 0
      const catKeys = ["E", "Es", "EP", "EPs", "ET", "EC", "ENR"];
      const anyPositive = catKeys.some((k) => {
        const el = form.elements.namedItem(`requested_${k}`) as HTMLInputElement | null;
        return (parseInt(el?.value ?? "0", 10) || 0) > 0;
      });
      if (!anyPositive) return false;
    }

    if (tabIndex === 4) {
      // History: prior_olympic answered; past_coverage_examples filled; press_card if freelance
      const olympicInputs = form.elements.namedItem("prior_olympic");
      const olympicAnswered = olympicInputs instanceof RadioNodeList
        ? Array.from(olympicInputs).some((el) => el instanceof HTMLInputElement && el.checked)
        : false;
      if (!olympicAnswered) return false;
      const coverage = form.elements.namedItem("past_coverage_examples");
      if (coverage instanceof HTMLTextAreaElement && !coverage.value.trim()) return false;

      const orgTypeEl = form.elements.namedItem("org_type") as HTMLSelectElement | null;
      const orgTypeVal = orgTypeEl?.value ?? "";
      const isFreelance = orgTypeVal === "freelance_journalist" || orgTypeVal === "freelance_photographer" || orgTypeVal === "freelancer";
      if (isFreelance) {
        const pressCard = form.elements.namedItem("press_card");
        const pressCardAnswered = pressCard instanceof RadioNodeList
          ? Array.from(pressCard).some((el) => el instanceof HTMLInputElement && el.checked)
          : false;
        if (!pressCardAnswered) return false;
      }
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

  // Mark the current tab as visited whenever it becomes active.
  // Covers keyboard-arrow navigation, direct tab-click navigation (redundant but safe),
  // and the initial-mount case. The "Continue" button intentionally does NOT pre-mark
  // the next tab, so the history-tab-visited gate in handleSubmit fires only when the
  // user has actually arrived on the history tab at least once.
  useEffect(() => {
    markVisited(activeTab);
    updateTabStatus();
  }, [activeTab, markVisited]); // eslint-disable-line react-hooks/exhaustive-deps

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

      // Accreditation: at least one requested_* > 0 (ENR included)
      if (tabIndex === 2) {
        const catKeys = ["E", "Es", "EP", "EPs", "ET", "EC", "ENR"];
        const anyPositive = catKeys.some((k) => {
          const el = form.elements.namedItem(`requested_${k}`) as HTMLInputElement | null;
          return (parseInt(el?.value ?? "0", 10) || 0) > 0;
        });
        if (!anyPositive || !allRequired) return "empty";
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

  // Per-tab validation run when the user clicks Continue. Gates advance so
  // applicants find missing required fields before reaching the final Submit.
  function validateTabFields(tabIndex: number): FormErrors {
    if (!formRef.current) return {};
    const form = formRef.current;
    const errs: FormErrors = {};

    // Required [data-tab] fields on this tab. Using the attribute keeps the
    // per-tab validator aligned with the markup rather than duplicating the
    // REQUIRED_FIELDS list.
    const tabEls = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        `input[required][data-tab="${tabIndex}"]:not([type='checkbox']), select[required][data-tab="${tabIndex}"], textarea[required][data-tab="${tabIndex}"]`
      )
    );
    const seenRadioGroups = new Set<string>();
    for (const el of tabEls) {
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

    // Tab-specific extras that handleSubmit also checks
    if (tabIndex === 0) {
      const orgTypeEl = form.elements.namedItem("org_type") as HTMLSelectElement | null;
      const orgTypeVal = orgTypeEl?.value ?? "";
      if (orgTypeVal === "non_mrh") {
        const subtype = form.elements.namedItem("non_mrh_media_type") as HTMLSelectElement | null;
        if (!subtype?.value) errs["non_mrh_media_type"] = "Please select a media type.";
        if (subtype?.value === "other") {
          const spec = form.elements.namedItem("non_mrh_media_type_other") as HTMLInputElement | null;
          if (!spec?.value.trim()) errs["non_mrh_media_type_other"] = "Please specify the media type.";
        }
      }
    }
    if (tabIndex === 1) {
      const orgTypeEl = form.elements.namedItem("org_type") as HTMLSelectElement | null;
      const orgTypeVal = orgTypeEl?.value ?? "";
      const isFreelance = orgTypeVal === "freelance_journalist" || orgTypeVal === "freelance_photographer" || orgTypeVal === "freelancer";
      if (!isFreelance) {
        for (const name of ["editor_in_chief_first_name", "editor_in_chief_last_name", "editor_in_chief_email"]) {
          const el = form.elements.namedItem(name) as HTMLInputElement | null;
          if (!el?.value.trim()) errs[name] = "Required for non-freelance organisations.";
        }
      }
    }
    if (tabIndex === 2) {
      const catKeys = ["E", "Es", "EP", "EPs", "ET", "EC", "ENR"];
      const anyPositive = catKeys.some((k) => {
        const el = form.elements.namedItem(`requested_${k}`) as HTMLInputElement | null;
        return (parseInt(el?.value ?? "0", 10) || 0) > 0;
      });
      if (!anyPositive) errs["category"] = "Please request at least one accreditation category.";
    }

    return errs;
  }

  function handleContinueClick() {
    const errs = validateTabFields(activeTab);
    if (Object.keys(errs).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errs }));
      // Build error list for the validation modal, mirroring final-submit UX.
      const errList = Object.keys(errs).map((name) => {
        const el = formRef.current?.querySelector<HTMLElement>(`[name="${name}"]`);
        const labelEl = el?.id
          ? document.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`)
          : null;
        const fieldLabel = labelEl?.textContent?.replace(/\s*\*|\(optional\)/g, "").trim()
          ?? (name === "category" ? "Accreditation category" : name.replace(/_/g, " "));
        return { tab: TABS[activeTab]?.label ?? "", field: fieldLabel };
      });
      setValidationErrors(errList);
      firstErrNameRef.current = Object.keys(errs)[0] ?? "";
      firstErrTabRef.current = activeTab;
      const errCount = errList.length;
      setErrorAnnouncement(
        errCount === 1
          ? t("validation.fieldsIncomplete.one")
          : t("validation.fieldsIncomplete.many").replace("{n}", String(errCount))
      );
      setShowValidationModal(true);
      return;
    }
    markVisited(activeTab);
    updateTabStatus();
    setActiveTab(activeTab + 1);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = formRef.current;
    if (!form) return;

    // The form has no `action` attribute — the server action is invoked
    // imperatively from handleConfirmedSubmit. We always block native
    // submission so Enter/autofill/regressed-button-type cannot reach the server.
    e.preventDefault();

    // Defense against a type-flip race: if React swaps Continue (type=button)
    // → Submit (type=submit) on the same DOM node during a click handler,
    // the browser may still fire the native submit default action. If the
    // submitter isn't our explicit final-tab Submit button, treat it as a
    // tab-advance, never as a real submit.
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const isRealSubmit = submitter?.dataset.eoiSubmit === "final";

    // Only validate and potentially surface the confirm modal from the last tab.
    // From any earlier tab (e.g. Enter key in a field), advance to the next tab.
    if (activeTab < TABS.length - 1 || !isRealSubmit) {
      if (activeTab < TABS.length - 1) setActiveTab(activeTab + 1);
      return;
    }

    // Gate: history tab (last tab) must have been visited before we accept submission.
    // This ensures the applicant actually opens the history tab rather than being
    // pre-marked visited by the Continue button.
    if (!visitedTabsRef.current.has(TABS.length - 1)) {
      setValidationErrors([{ tab: TABS[TABS.length - 1].label, field: t("validation.tabIncomplete") }]);
      firstErrTabRef.current = TABS.length - 1;
      firstErrNameRef.current = "";
      setErrorAnnouncement(t("validation.tabsIncomplete.one"));
      setShowValidationModal(true);
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

    // Custom: at least one accreditation category must be requested (> 0), incl. ENR
    const catKeys = ["E", "Es", "EP", "EPs", "ET", "EC", "ENR"];
    const anyPositive = catKeys.some((k) => {
      const el = form.elements.namedItem(`requested_${k}`) as HTMLInputElement | null;
      return (parseInt(el?.value ?? "0", 10) || 0) > 0;
    });
    if (!anyPositive) errs["category"] = "Please request at least one accreditation category.";

    // Editor-in-Chief required unless freelance org type
    const orgTypeEl = form.elements.namedItem("org_type") as HTMLSelectElement | null;
    const orgTypeVal = orgTypeEl?.value ?? "";
    const isFreelance = orgTypeVal === "freelance_journalist" || orgTypeVal === "freelance_photographer" || orgTypeVal === "freelancer";
    if (!isFreelance) {
      for (const name of ["editor_in_chief_first_name", "editor_in_chief_last_name", "editor_in_chief_email"]) {
        const el = form.elements.namedItem(name) as HTMLInputElement | null;
        if (!el?.value.trim()) errs[name] = "Required for non-freelance organisations.";
      }
    }
    // Non-MRH sub-dropdown
    if (orgTypeVal === "non_mrh") {
      const subtype = form.elements.namedItem("non_mrh_media_type") as HTMLSelectElement | null;
      if (!subtype?.value) errs["non_mrh_media_type"] = "Please select a media type.";
      if (subtype?.value === "other") {
        const spec = form.elements.namedItem("non_mrh_media_type_other") as HTMLInputElement | null;
        if (!spec?.value.trim()) errs["non_mrh_media_type_other"] = "Please specify the media type.";
      }
    }

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
      const categories = ["E", "Es", "EP", "EPs", "ET", "EC", "ENR"]
        .map((cat) => {
          const el = form.elements.namedItem(`requested_${cat}`) as HTMLInputElement | null;
          const n = parseInt(el?.value ?? "0", 10) || 0;
          return n > 0 ? `${cat} (${n})` : null;
        })
        .filter((s): s is string => s !== null);
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

    setFieldErrors(errs);

    // Find first error element and tab — stored in refs for use when modal closes
    const firstErrEl = requiredEls.find((el) => errs[el.name]) ?? null;
    const firstErrTab = firstErrEl
      ? parseInt(firstErrEl.getAttribute("data-tab") ?? "0", 10)
      : errs["category"] ? 2
      : 0;
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
      : formRef.current?.querySelector<HTMLElement>('[name^="requested_"]');
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus();
  }

  function handleConfirmedSubmit() {
    const form = formRef.current;
    if (!form) return;
    if (!gdprAccepted) return; // guard; button is disabled anyway
    setShowConfirmModal(false);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(visitedKey);
    // Invoke the server action imperatively with the form's FormData.
    // The form element intentionally has no `action` attribute so this is
    // the ONLY path that can reach submitApplication (prevents ambient submit hijack).
    const fd = new FormData(form);
    fd.set("gdpr_accepted", "true");
    startSubmitTransition(async () => {
      await submitApplication(fd);
    });
  }

  return (
    <>
      {/* How does this work? collapsible intro */}
      <details className="mb-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
        <summary className="px-4 sm:px-5 py-3.5 text-sm font-medium text-brand-blue cursor-pointer select-none hover:bg-gray-50 flex items-center gap-2">
          <Icon name="info" label="Info" className="w-4 h-4 text-brand-blue" /> {t("form.intro.summary")}
        </summary>
        <div className="px-4 sm:px-5 py-4 border-t border-gray-100 text-sm text-gray-700 space-y-2">
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

    <form ref={formRef} noValidate onInput={handleInput} onChange={(e) => { handleCountryChange(e.nativeEvent); handleInput(); }} onBlur={handleFormBlur} onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && (e.target as HTMLElement).tagName !== "BUTTON") e.preventDefault(); }} className="space-y-0">
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
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue ${
                  active
                    ? "border-brand-blue text-brand-blue bg-white"
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
      <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-4 sm:p-8">
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
              key="eoi-nav-continue"
              type="button"
              onClick={handleContinueClick}
              className="px-5 py-2.5 bg-brand-blue text-white text-sm font-semibold rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
            >
              {t("form.nav.continue")}
            </button>
          ) : (
            <button
              key="eoi-nav-submit"
              type="submit"
              data-eoi-submit="final"
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
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
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
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-4 mb-5">
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                {t("form.confirmModal.summary.organisation")}
              </div>
              <div className="font-medium text-gray-900">{modalSummary.orgName}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                {t("form.confirmModal.summary.categories")}
              </div>
              <div className="font-medium text-gray-900">{modalSummary.categories.join(", ")}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                {t("form.confirmModal.summary.contact")}
              </div>
              <div className="font-medium text-gray-900">
                {modalSummary.contactName} · {modalSummary.contactEmail}
              </div>
            </div>
          </div>

          {/* GDPR disclaimer — mandatory per LA28 Apr 2026 spec */}
          <label className="block bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-5 cursor-pointer">
            <span className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={gdprAccepted}
                onChange={(e) => setGdprAccepted(e.target.checked)}
                className="mt-0.5 accent-brand-blue cursor-pointer"
              />
              <span className="text-xs text-indigo-900 leading-relaxed">
                <b>Privacy notice:</b> I consent to the LA 2028 Organising Committee, the IOC and
                my National Olympic Committee processing the personal data in this application for
                the purpose of evaluating my press accreditation request. I understand that my data
                will be stored securely and handled in line with applicable data-protection law.
                <span className="text-red-500"> *</span>
              </span>
            </span>
          </label>

          <div className="flex gap-3">
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
              disabled={isSubmitting || !gdprAccepted}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isResubmission ? t("form.confirmModal.confirmResubmit") : isPendingEdit ? t("form.confirmModal.saveChanges") : t("form.confirmModal.confirmSubmit")}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
