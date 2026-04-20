"use client";

import type { FormErrors, PrefillData } from "../EoiFormTabs";
import type { Lang } from "@/lib/i18n";
import { AdditionalQuestionsFields } from "@/app/applyb/form/steps/AdditionalQuestionsFields";

// /apply is now aligned with /applyb on fields (LA28 Apr 2026 Excel spec).
// Additional Questions section: history (Olympic only), press card, comments.
// Paralympic fields removed per spec.
export function HistoryTab({
  prefill,
  errors,
  lang = "en",
}: {
  prefill: PrefillData | null;
  errors?: FormErrors;
  lang?: Lang;
}) {
  void lang;
  const orgType = prefill?.orgType ?? "";
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        Your prior-Games history, press card (freelancers only), and any additional notes for your NOC.
      </div>
      <AdditionalQuestionsFields prefill={prefill} errors={errors} orgType={orgType} />
    </div>
  );
}
