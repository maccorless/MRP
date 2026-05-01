"use client";

import { PublicationFields } from "./PublicationFields";
import { AdditionalQuestionsFields } from "./AdditionalQuestionsFields";
import type { PrefillData, FormErrors } from "../EoiFormWizard";

export function StoryStep({
  prefill,
  errors,
  orgType,
}: {
  prefill: PrefillData | null;
  errors?: FormErrors;
  orgType: string;
}) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Your publication / media
        </h3>
        <PublicationFields prefill={prefill} orgType={orgType} />
      </section>

      <section className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Additional questions
        </h3>
        <AdditionalQuestionsFields prefill={prefill} errors={errors} orgType={orgType} />
      </section>
    </div>
  );
}
