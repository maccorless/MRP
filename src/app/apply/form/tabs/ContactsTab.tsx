"use client";

import type { FormErrors, PrefillData } from "../EoiFormTabs";
import type { Lang } from "@/lib/i18n";
import { ContactsStep } from "@/app/applyb/form/steps/ContactsStep";

// /apply is now aligned with /applyb on fields (LA28 Apr 2026 Excel spec).
// Primary contact + Editor-in-Chief; email readonly from login.
export function ContactsTab({
  prefill,
  email,
  errors,
  lang = "en",
}: {
  prefill: PrefillData | null;
  email: string;
  errors?: FormErrors;
  lang?: Lang;
}) {
  const orgType = prefill?.orgType ?? "";
  return <ContactsStep prefill={prefill} email={email} errors={errors} orgType={orgType} lang={lang} />;
}
