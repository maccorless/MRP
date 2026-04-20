"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { flushSync } from "react-dom";
import { submitApplication, checkNocWindow } from "../actions";
import { OrganisationStep } from "./steps/OrganisationStep";
import { ContactsStep } from "./steps/ContactsStep";
import { AccreditationStep } from "./steps/AccreditationStep";
import { StoryStep } from "./steps/StoryStep";
import type { PrefillData as BasePrefillData } from "@/app/apply/form/EoiFormTabs";
import { COUNTRY_TO_NOC, NOC_CODE_SET } from "@/lib/codes";
import { FREELANCE_ORG_TYPES } from "@/lib/labels";
import type { Lang } from "@/lib/i18n";

export type PrefillData = BasePrefillData;
export type FormErrors = Record<string, string>;

type StepId = "story" | "applying" | "organisation";

type StepDef = {
  id: StepId;
  title: string;
  subtitle: string;
  // Fields that must be non-empty for the step to be marked complete.
  // Some are conditional — see isStepComplete.
  requiredFieldNames: string[];
};

// Concept B step order — story first, accreditation middle, admin last.
// Content of each step is Excel-aligned.
const STEPS: StepDef[] = [
  {
    id: "story",
    title: "Your story",
    subtitle: "What you cover, your reach, and your track record — the parts IOC reviewers weigh most.",
    requiredFieldNames: ["prior_olympic", "past_coverage_examples"],
    // press_card + press_card_issuer required only when org_type is freelance
  },
  {
    id: "applying",
    title: "What you're applying for",
    subtitle: "The accreditation categories and headcount you need.",
    requiredFieldNames: ["about"],
    // Plus: at least one of requested_* must be > 0
  },
  {
    id: "organisation",
    title: "About your organisation",
    subtitle: "Admin details we need for records.",
    requiredFieldNames: [
      "org_name", "org_type", "website", "address", "city", "postal_code",
      "country", "noc_code", "org_phone", "org_email",
      "contact_first_name", "contact_last_name", "contact_title", "contact_cell",
    ],
    // Editor-in-Chief required unless freelance
    // Non-MRH sub-dropdown required only when org_type = non_mrh
    // org_type_other required only when org_type = other
  },
];

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

export function EoiFormWizard({
  token,
  email,
  resubmitId,
  prefill,
  isResubmission,
  isPendingEdit = false,
  isFromInvite = false,
  countryCodes,
  nocCodes,
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
  const [activeStep, setActiveStep] = useState(0);
  const [currentOrgType, setCurrentOrgType] = useState<string>(prefill?.orgType ?? "");
  const [stepComplete, setStepComplete] = useState<boolean[]>([false, false, false]);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [errorAnnouncement, setErrorAnnouncement] = useState("");
  const [nocWindowClosed, setNocWindowClosed] = useState(false);
  const [nocAutoSuggestedName, setNocAutoSuggestedName] = useState<string | null>(null);
  const autoSuggestedNocRef = useRef<string | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const validationModalRef = useRef<HTMLDivElement>(null);
  const firstErrNameRef = useRef<string>("");
  const firstErrStepRef = useRef<number>(0);
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

  const storageKey = `eoib-draft-${email}`;

  // Recompute step completeness on any form change
  const recomputeStepStatus = useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const orgTypeVal = (fd.get("org_type") as string) ?? "";
    const isFreelance = FREELANCE_ORG_TYPES.has(orgTypeVal);

    const isFieldFilled = (name: string): boolean => {
      // Handle radios/checkboxes/textareas/inputs uniformly
      const el = form.elements.namedItem(name);
      if (!el) return false;
      if (el instanceof RadioNodeList) {
        return Array.from(el).some((n) => n instanceof HTMLInputElement && n.checked);
      }
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        return el.value.trim() !== "";
      }
      return false;
    };

    const results: boolean[] = STEPS.map((step, idx) => {
      // Core required fields
      for (const name of step.requiredFieldNames) {
        if (!isFieldFilled(name)) return false;
      }

      // Step 0 — story: press_card + press_card_issuer if freelance
      if (idx === 0) {
        if (isFreelance) {
          const pc = (fd.get("press_card") as string) ?? "";
          if (pc !== "yes" && pc !== "no") return false;
          if (pc === "yes" && !isFieldFilled("press_card_issuer")) return false;
        }
        // If prior_olympic === "yes", olympic editions required
        const priorOlympic = (fd.get("prior_olympic") as string) ?? "";
        if (priorOlympic === "yes") {
          const editions = (fd.get("prior_olympic_years") as string) ?? "";
          if (!editions.trim()) return false;
        }
      }

      // Step 1 — applying: at least one requested_* > 0
      if (idx === 1) {
        const catKeys = ["E", "Es", "EP", "EPs", "ET", "EC", "ENR"];
        const anyPositive = catKeys.some((k) => {
          const v = parseInt((fd.get(`requested_${k}`) as string) ?? "0", 10) || 0;
          return v > 0;
        });
        if (!anyPositive) return false;
        // ENR max 3
        const enr = parseInt((fd.get("requested_ENR") as string) ?? "0", 10) || 0;
        if (enr > 3) return false;
        // Others max 100
        for (const k of ["E", "Es", "EP", "EPs", "ET", "EC"]) {
          const v = parseInt((fd.get(`requested_${k}`) as string) ?? "0", 10) || 0;
          if (v > 100) return false;
        }
      }

      // Step 2 — organisation:
      if (idx === 2) {
        // Editor-in-Chief required unless freelance
        if (!isFreelance) {
          if (!isFieldFilled("editor_in_chief_first_name")) return false;
          if (!isFieldFilled("editor_in_chief_last_name")) return false;
          if (!isFieldFilled("editor_in_chief_email")) return false;
        }
        // Non-MRH sub-dropdown
        if (orgTypeVal === "non_mrh") {
          const subtype = (fd.get("non_mrh_media_type") as string) ?? "";
          if (!subtype) return false;
          if (subtype === "other" && !isFieldFilled("non_mrh_media_type_other")) return false;
        }
        // Other — specify
        if (orgTypeVal === "other" && !isFieldFilled("org_type_other")) return false;
      }

      return true;
    });

    setStepComplete(results);
  }, []);

  // Tick "saved Xs ago"
  useEffect(() => {
    const timer = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Restore from localStorage on mount
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
            if (elements.type === "checkbox") elements.checked = value === "true";
            else elements.value = value;
          } else if (elements instanceof HTMLTextAreaElement || elements instanceof HTMLSelectElement) {
            elements.value = value;
          }
        }
        setSavedAt(new Date());
      }
    } catch { /* ignore */ }
    recomputeStepStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useModalEsc(showConfirmModal, modalRef, () => setShowConfirmModal(false));
  useModalEsc(showValidationModal, validationModalRef, () => setShowValidationModal(false));

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleInput = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (!formRef.current) return;
      const fd = new FormData(formRef.current);
      const data: Record<string, string> = {};
      for (const [key, val] of fd.entries()) {
        if (key === "token" || key === "email" || key === "resubmit_id") continue;
        data[key] = String(val);
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        setSavedAt(new Date());
      } catch { /* full */ }
      recomputeStepStatus();
    }, 500);
  }, [storageKey, recomputeStepStatus]);

  function handleCountryChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.name !== "country") return;
    const countryCode = target.value.split(" — ")[0].trim().toUpperCase();
    const suggestedNocCode = COUNTRY_TO_NOC[countryCode];
    if (!suggestedNocCode) return;
    const nocInput = formRef.current?.elements.namedItem("noc_code") as HTMLInputElement | null;
    if (!nocInput) return;
    if (!nocInput.value || nocInput.value === autoSuggestedNocRef.current) {
      const nocEntry = nocCodes.find((n) => n.code === suggestedNocCode);
      if (nocEntry) {
        const newVal = `${nocEntry.code} — ${nocEntry.name}`;
        nocInput.value = newVal;
        autoSuggestedNocRef.current = newVal;
        setNocAutoSuggestedName(nocEntry.name);
      }
    }
  }

  async function handleFormBlur(e: React.FocusEvent<HTMLFormElement>) {
    const target = e.target as unknown as HTMLInputElement;
    if (target.name !== "noc_code") return;
    const raw = target.value.trim();
    if (raw !== autoSuggestedNocRef.current) setNocAutoSuggestedName(null);
    if (!raw) { setNocWindowClosed(false); return; }
    const nocCode = raw.split(" — ")[0].trim().toUpperCase();
    if (!NOC_CODE_SET.has(nocCode)) return;
    const { closed } = await checkNocWindow(nocCode);
    setNocWindowClosed(closed);
  }

  function goToStep(n: number) {
    setActiveStep(Math.max(0, Math.min(STEPS.length - 1, n)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateAndSubmit() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const errs: FormErrors = {};
    const orgTypeVal = (fd.get("org_type") as string) ?? "";
    const isFreelance = FREELANCE_ORG_TYPES.has(orgTypeVal);

    // HTML5-required fields scan
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
        if (!checked) errs[el.name] = "Please select an option.";
      } else {
        const empty = el instanceof HTMLSelectElement ? !el.value : !el.value.trim();
        if (empty) errs[el.name] = "This field is required.";
      }
    }

    // At least one category requested
    const catKeys = ["E", "Es", "EP", "EPs", "ET", "EC", "ENR"];
    const anyPositive = catKeys.some((k) => (parseInt((fd.get(`requested_${k}`) as string) ?? "0", 10) || 0) > 0);
    if (!anyPositive) errs["category"] = "Please request at least one accreditation category.";

    // Max limits
    const enr = parseInt((fd.get("requested_ENR") as string) ?? "0", 10) || 0;
    if (enr > 3) errs["requested_ENR"] = "ENR is limited to a maximum of 3 accreditations.";
    for (const k of ["E", "Es", "EP", "EPs", "ET", "EC"]) {
      const v = parseInt((fd.get(`requested_${k}`) as string) ?? "0", 10) || 0;
      if (v > 100) errs[`requested_${k}`] = "The value must be less than or equal to 100.";
    }

    // Editor-in-Chief required for non-freelancers
    if (!isFreelance) {
      for (const name of ["editor_in_chief_first_name", "editor_in_chief_last_name", "editor_in_chief_email"]) {
        const v = (fd.get(name) as string)?.trim() ?? "";
        if (!v) errs[name] = "This field is required for non-freelance organisations.";
      }
    }

    // Non-MRH sub-dropdown
    if (orgTypeVal === "non_mrh") {
      if (!(fd.get("non_mrh_media_type") as string)?.trim()) {
        errs["non_mrh_media_type"] = "Please select a media type.";
      }
      if ((fd.get("non_mrh_media_type") as string) === "other" && !(fd.get("non_mrh_media_type_other") as string)?.trim()) {
        errs["non_mrh_media_type_other"] = "Please specify the media type.";
      }
    }
    if (orgTypeVal === "other" && !(fd.get("org_type_other") as string)?.trim()) {
      errs["org_type_other"] = "Please specify the organisation type.";
    }

    // URL validation
    const urlInputs = form.querySelectorAll<HTMLInputElement>('input[type="url"]');
    for (const input of urlInputs) {
      if (input.value && input.value !== "https://" && !input.value.match(/^https?:\/\/.+\..+/)) {
        errs[input.name] = "Please enter a valid URL (https://...).";
      }
    }

    if (Object.keys(errs).length === 0) {
      setFieldErrors({});
      setErrorAnnouncement("");
      const categories = catKeys.filter((k) => (parseInt((fd.get(`requested_${k}`) as string) ?? "0", 10) || 0) > 0);
      const orgEl = fd.get("org_name") as string;
      const firstEl = fd.get("contact_first_name") as string;
      const lastEl = fd.get("contact_last_name") as string;
      setModalSummary({
        orgName: orgEl ?? "",
        categories,
        contactName: [firstEl, lastEl].filter(Boolean).join(" "),
        contactEmail: email,
      });
      setShowConfirmModal(true);
      return;
    }

    setFieldErrors(errs);

    // Map errors to steps: fields belong to a step based on their data-tab attribute
    // data-tab mapping: 0,1 → Step 2 (org); 2 → Step 1 (applying); 3,4 → Step 0 (story)
    const TAB_TO_STEP: Record<number, number> = { 0: 2, 1: 2, 2: 1, 3: 0, 4: 0 };

    const firstErrEl = requiredEls.find((el) => errs[el.name]) ?? null;
    const firstErrTab = firstErrEl
      ? parseInt(firstErrEl.getAttribute("data-tab") ?? "2", 10)
      : errs["category"] ? 2
      : 0;
    firstErrNameRef.current = firstErrEl?.name ?? "";
    firstErrStepRef.current = TAB_TO_STEP[firstErrTab] ?? 0;

    const errList = Object.keys(errs).map((name) => {
      const el = requiredEls.find((r) => r.name === name);
      const tabIndex = el ? parseInt(el.getAttribute("data-tab") ?? "2", 10) : 0;
      const stepIndex = TAB_TO_STEP[tabIndex] ?? 0;
      const labelEl = el?.id ? document.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`) : null;
      const fieldLabel = labelEl?.textContent?.replace(/\s*\*|\(optional\)/g, "").trim() ?? name.replace(/_/g, " ");
      return { tab: STEPS[stepIndex]?.title ?? "Unknown", field: fieldLabel };
    });
    setValidationErrors(errList);
    const errCount = Object.keys(errs).length;
    setErrorAnnouncement(
      errCount === 1 ? "1 field needs your attention." : `${errCount} fields need your attention.`
    );
    setShowValidationModal(true);
  }

  function handleGoToFirstError() {
    setShowValidationModal(false);
    const stepIndex = firstErrStepRef.current;
    const errName = firstErrNameRef.current;
    flushSync(() => setActiveStep(stepIndex));
    const target = errName
      ? formRef.current?.querySelector<HTMLElement>(`[name="${errName}"]`)
      : formRef.current?.querySelector<HTMLElement>('[name^="requested_"]');
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus();
  }

  function handleConfirmedSubmit() {
    const form = formRef.current;
    if (!form) return;
    if (!gdprAccepted) return; // guard; the button should be disabled anyway
    setShowConfirmModal(false);
    localStorage.removeItem(storageKey);
    const fd = new FormData(form);
    fd.set("gdpr_accepted", "true");
    startSubmitTransition(async () => {
      await submitApplication(fd);
    });
  }

  const savedAgoText = (() => {
    if (!savedAt) return null;
    void nowTick;
    const seconds = Math.floor((Date.now() - savedAt.getTime()) / 1000);
    if (seconds < 3) return "Saved just now";
    if (seconds < 60) return `Saved ${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Saved ${minutes}m ago`;
    return `Saved ${Math.floor(minutes / 60)}h ago`;
  })();

  const step = STEPS[activeStep];
  const progressPct = Math.round((stepComplete.filter(Boolean).length / STEPS.length) * 100);

  return (
    <>
      {nocWindowClosed && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-300 rounded-lg" role="alert">
          <div className="text-sm font-semibold text-orange-800 mb-1">This NOC's application window is closed</div>
          <p className="text-sm text-orange-700">Please contact your NOC or verify your country.</p>
        </div>
      )}

      <form
        ref={formRef}
        noValidate
        onInput={handleInput}
        onChange={(e) => { handleCountryChange(e.nativeEvent); handleInput(); }}
        onBlur={handleFormBlur}
        onSubmit={(e) => { e.preventDefault(); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && (e.target as HTMLElement).tagName !== "BUTTON") {
            e.preventDefault();
          }
        }}
        className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-6"
      >
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        {resubmitId && <input type="hidden" name="resubmit_id" value={resubmitId} />}

        <div aria-live="polite" aria-atomic="true" className="sr-only">{errorAnnouncement}</div>

        {/* Stepper */}
        <aside className="sm:sticky sm:top-6 sm:self-start">
          {/* Mobile progress */}
          <div className="sm:hidden mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Step {activeStep + 1} of {STEPS.length} · {step.title}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-blue transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            {savedAgoText && (
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                {savedAgoText}
              </div>
            )}
          </div>

          {/* Desktop vertical stepper */}
          <div className="hidden sm:block">
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Progress</div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="text-xs text-gray-500 mt-1.5">
                {stepComplete.filter(Boolean).length} of {STEPS.length} steps complete
              </div>
            </div>

            <ol className="space-y-0.5">
              {STEPS.map((s, i) => {
                const isActive = i === activeStep;
                const isDone = stepComplete[i];
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goToStep(i)}
                      className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                        isActive ? "bg-blue-50 border-l-4 border-brand-blue pl-2" :
                        isDone   ? "hover:bg-gray-50 border-l-4 border-green-500 pl-2" :
                                   "hover:bg-gray-50 border-l-4 border-transparent pl-2"
                      }`}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isDone   ? "bg-green-500 text-white" :
                        isActive ? "bg-brand-blue text-white" :
                                   "bg-gray-200 text-gray-500"
                      }`}>
                        {isDone ? "✓" : i + 1}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-sm font-medium ${isActive ? "text-brand-blue" : isDone ? "text-gray-900" : "text-gray-700"}`}>
                          {s.title}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {savedAgoText && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                {savedAgoText}
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <section className="min-w-0">
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-8">
            <div className="mb-6">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Step {activeStep + 1} of {STEPS.length}</div>
              <h2 className="text-xl font-bold text-gray-900">{step.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{step.subtitle}</p>
            </div>

            {/* All steps rendered once; inactive hidden via CSS so their fields remain in the DOM for submission */}
            <div style={{ display: activeStep === 0 ? undefined : "none" }}>
              <StoryStep prefill={prefill} errors={fieldErrors} orgType={currentOrgType} />
            </div>
            <div style={{ display: activeStep === 1 ? undefined : "none" }}>
              <AccreditationStep prefill={prefill} errors={fieldErrors} />
            </div>
            <div style={{ display: activeStep === 2 ? undefined : "none" }}>
              <OrganisationStep
                prefill={prefill}
                errors={fieldErrors}
                countryCodes={countryCodes}
                nocCodes={nocCodes}
                orgType={currentOrgType}
                onOrgTypeChange={(v) => { setCurrentOrgType(v); setTimeout(recomputeStepStatus, 0); }}
                nocAutoSuggestedName={nocAutoSuggestedName}
              />
              <div className="mt-6 pt-6 border-t border-gray-100">
                <ContactsStep prefill={prefill} email={email} errors={fieldErrors} orgType={currentOrgType} />
              </div>
            </div>

            {/* Nav */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {activeStep > 0 ? (
                <button
                  type="button"
                  onClick={() => goToStep(activeStep - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  ← Back
                </button>
              ) : <div />}

              {activeStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep(activeStep + 1)}
                  className="px-5 py-2.5 bg-brand-blue text-white text-sm font-semibold rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={validateAndSubmit}
                  className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition-colors cursor-pointer"
                >
                  {isResubmission ? "Resubmit" : isPendingEdit ? "Save changes" : "Review & submit"}
                </button>
              )}
            </div>
          </div>
        </section>
      </form>

      {/* Validation errors modal */}
      {showValidationModal && (
        <div
          role="dialog" aria-modal="true" aria-labelledby="validation-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
        >
          <div ref={validationModalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 id="validation-modal-title" className="text-lg font-bold text-gray-900 mb-1">
              Before you submit
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              A few fields still need your attention:
            </p>
            <ul role="list" className="mb-5 space-y-1.5">
              {validationErrors.map((err) => (
                <li key={`${err.tab}:${err.field}`} className="text-sm text-gray-800">
                  <span className="font-medium text-gray-500">{err.tab}:</span> {err.field}
                </li>
              ))}
            </ul>
            <button
              type="button" onClick={handleGoToFirstError}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
            >
              Take me to the first one →
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal with GDPR */}
      {showConfirmModal && modalSummary && (
        <div
          role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
        >
          <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 id="confirm-modal-title" className="text-lg font-bold text-gray-900 mb-1">
              {isResubmission ? "Resubmit application" : isPendingEdit ? "Save changes" : "Submit your application"}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Please review the summary and accept the privacy notice to continue.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2 mb-5">
              <div>
                <span className="text-gray-500">Organisation:</span>
                <span className="ml-2 font-medium text-gray-900">{modalSummary.orgName}</span>
              </div>
              <div>
                <span className="text-gray-500">Categories:</span>
                <span className="ml-2 font-medium text-gray-900">{modalSummary.categories.join(", ")}</span>
              </div>
              <div>
                <span className="text-gray-500">Contact:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {modalSummary.contactName} · {modalSummary.contactEmail}
                </span>
              </div>
            </div>

            {/* GDPR disclaimer */}
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
                  the purpose of evaluating my press accreditation request. I understand that my
                  data will be stored securely and handled in line with applicable data-protection law.
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
                Go back
              </button>
              <button
                type="button"
                onClick={handleConfirmedSubmit}
                disabled={isSubmitting || !gdprAccepted}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isResubmission ? "Confirm resubmission" : isPendingEdit ? "Save changes" : "Submit application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
