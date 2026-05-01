"use client";

import type { PrefillData } from "../EoiFormTabs";
import type { Lang } from "@/lib/i18n";
import { PublicationFields } from "@/app/applyb/form/steps/PublicationFields";

// /apply is now aligned with /applyb on fields (LA28 Apr 2026 Excel spec).
// Media questions only; publication_types and sports_to_cover removed per spec.
export function PublicationTab({ prefill, lang = "en", orgType = "" }: { prefill: PrefillData | null; lang?: Lang; orgType?: string }) {
  void lang;
  return (
    <div className="space-y-6">
      <PublicationFields prefill={prefill} orgType={orgType} />
    </div>
  );
}
