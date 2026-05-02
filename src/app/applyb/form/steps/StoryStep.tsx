"use client";

import { PublicationFields } from "./PublicationFields";
import { AdditionalQuestionsFields } from "./AdditionalQuestionsFields";
import type { PrefillData, FormErrors } from "../EoiFormWizard";
import { makeT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export function StoryStep({
  prefill,
  errors,
  orgType,
  lang = "en",
}: {
  prefill: PrefillData | null;
  errors?: FormErrors;
  orgType: string;
  lang?: Lang;
}) {
  const t = makeT(lang);

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          {t("applyb.story.section.pub")}
        </h3>
        <PublicationFields prefill={prefill} orgType={orgType} lang={lang} />
      </section>

      <section className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          {t("applyb.story.section.addl")}
        </h3>
        <AdditionalQuestionsFields prefill={prefill} errors={errors} orgType={orgType} lang={lang} />
      </section>
    </div>
  );
}
