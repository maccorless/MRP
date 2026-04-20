"use client";

import { useState } from "react";
import type { FormErrors, PrefillData } from "../EoiFormTabs";
import type { Lang } from "@/lib/i18n";
import { OrganisationStep } from "@/app/applyb/form/steps/OrganisationStep";

// /apply is now aligned with /applyb on fields (LA28 Apr 2026 Excel spec).
// The tab layout is the only difference — we wrap the shared OrganisationStep.
// `isResubmission` and `lang` are accepted for API compatibility with the
// existing EoiFormTabs controller; the shared step already handles prefilling.

export function OrganisationTab({
  prefill,
  isResubmission,
  countryCodes,
  nocCodes,
  errors,
  nocAutoSuggestedName,
  lang = "en",
}: {
  prefill: PrefillData | null;
  isResubmission: boolean;
  countryCodes: { code: string; name: string }[];
  nocCodes: { code: string; name: string }[];
  errors?: FormErrors;
  nocAutoSuggestedName?: string | null;
  lang?: Lang;
}) {
  const [orgType, setOrgType] = useState<string>(prefill?.orgType ?? "");
  void lang;

  if (isResubmission && prefill) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
          Organisation details are locked during resubmission. If anything is
          incorrect, contact your NOC.
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div><dt className="text-gray-500 text-xs">Organisation</dt><dd className="font-medium text-gray-900">{prefill.orgName}</dd></div>
          <div><dt className="text-gray-500 text-xs">NOC</dt><dd className="text-gray-900">{prefill.orgNocCode}</dd></div>
          <div><dt className="text-gray-500 text-xs">Country</dt><dd className="text-gray-900">{prefill.orgCountry}</dd></div>
          <div><dt className="text-gray-500 text-xs">Type</dt><dd className="text-gray-900">{prefill.orgType}</dd></div>
        </dl>
      </div>
    );
  }

  return (
    <OrganisationStep
      prefill={prefill}
      errors={errors}
      countryCodes={countryCodes}
      nocCodes={nocCodes}
      orgType={orgType}
      onOrgTypeChange={setOrgType}
      nocAutoSuggestedName={nocAutoSuggestedName ?? null}
    />
  );
}
