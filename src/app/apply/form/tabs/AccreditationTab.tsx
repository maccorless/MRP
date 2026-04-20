"use client";

import type { FormErrors, PrefillData } from "../EoiFormTabs";
import type { Lang } from "@/lib/i18n";
import { AccreditationStep } from "@/app/applyb/form/steps/AccreditationStep";

// /apply is now aligned with /applyb on fields (LA28 Apr 2026 Excel spec).
// 7 numeric fields always visible: E, Es, EP, EPs, Ec, ET, ENR (max 3).
export function AccreditationTab({
  prefill,
  errors,
  orgType,
  lang = "en",
}: {
  prefill: PrefillData | null;
  errors?: FormErrors;
  orgType?: string;
  lang?: Lang;
}) {
  void lang;
  void orgType;
  return <AccreditationStep prefill={prefill} errors={errors} />;
}
