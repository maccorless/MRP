"use client";

import { useState } from "react";
import type { FormErrors, PrefillData } from "../EoiFormTabs";
import { makeT, type Lang } from "@/lib/i18n";
import { INPUT, LABEL, HELP, inp, Err } from "../form-styles";

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
  const t = makeT(lang);
  const hasSecondary = !!(prefill?.secondaryFirstName || prefill?.secondaryLastName);
  const [showSecondary, setShowSecondary] = useState(hasSecondary);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        {t("contacts.intro")}
      </div>

      {/* Primary contact */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{t("contacts.primary.heading")}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact_first_name" className={LABEL}>{t("contacts.firstName.label")} <span className="text-red-500">*</span></label>
              <input id="contact_first_name" name="contact_first_name" type="text" required data-tab="1"
                defaultValue={prefill?.contactFirstName ?? ""} placeholder={t("contacts.firstName.placeholder")} className={inp("contact_first_name", errors)}
                aria-invalid={!!errors?.contact_first_name} aria-describedby={errors?.contact_first_name ? "err-contact_first_name" : undefined} />
              <Err name="contact_first_name" errors={errors} />
            </div>
            <div>
              <label htmlFor="contact_last_name" className={LABEL}>{t("contacts.lastName.label")} <span className="text-red-500">*</span></label>
              <input id="contact_last_name" name="contact_last_name" type="text" required data-tab="1"
                defaultValue={prefill?.contactLastName ?? ""} placeholder={t("contacts.lastName.placeholder")} className={inp("contact_last_name", errors)}
                aria-invalid={!!errors?.contact_last_name} aria-describedby={errors?.contact_last_name ? "err-contact_last_name" : undefined} />
              <Err name="contact_last_name" errors={errors} />
            </div>
          </div>
          <div>
            <label htmlFor="contact_title" className={LABEL}>{t("contacts.title.label")}</label>
            <input id="contact_title" name="contact_title" type="text" data-tab="1"
              defaultValue={prefill?.contactTitle ?? ""} placeholder={t("contacts.title.placeholder")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="contact_email_display" className={LABEL}>{t("contacts.email.label")}</label>
            <input id="contact_email_display" type="email" value={email} disabled
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500" />
            <p className={HELP}>{t("contacts.email.help")}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact_phone" className={LABEL}>{t("contacts.phone.label")}</label>
              <input id="contact_phone" name="contact_phone" type="tel" data-tab="1"
                defaultValue={prefill?.contactPhone ?? ""} placeholder={t("contacts.phone.placeholder")} className={INPUT} />
            </div>
            <div>
              <label htmlFor="contact_cell" className={LABEL}>{t("contacts.cell.label")}</label>
              <input id="contact_cell" name="contact_cell" type="tel" data-tab="1"
                defaultValue={prefill?.contactCell ?? ""} placeholder={t("contacts.cell.placeholder")} className={INPUT} />
            </div>
          </div>
          <div>
            <label htmlFor="org_email" className={LABEL}>
              {t("contacts.orgEmail.label")} <span className="text-gray-400 font-normal">{t("contacts.orgEmail.optional")}</span>
            </label>
            <input id="org_email" name="org_email" type="email" data-tab="1"
              defaultValue={prefill?.orgEmail ?? ""} placeholder={t("contacts.orgEmail.placeholder")} className={INPUT} />
          </div>
        </div>
      </div>

      {/* Secondary contact toggle */}
      <div className="border-t border-gray-100 pt-6">
        {!showSecondary ? (
          <button
            type="button"
            onClick={() => setShowSecondary(true)}
            className="text-sm text-brand-blue font-medium hover:underline cursor-pointer"
          >
            {t("contacts.addSecondary")}
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">{t("contacts.secondary.heading")}</h3>
              <button
                type="button"
                onClick={() => setShowSecondary(false)}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {t("contacts.secondary.remove")}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">
              {t("contacts.secondary.help")}
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="secondary_first_name" className={LABEL}>{t("contacts.secondary.firstName.label")}</label>
                  <input id="secondary_first_name" name="secondary_first_name" type="text" data-tab="1"
                    defaultValue={prefill?.secondaryFirstName ?? ""} className={INPUT} />
                </div>
                <div>
                  <label htmlFor="secondary_last_name" className={LABEL}>{t("contacts.secondary.lastName.label")}</label>
                  <input id="secondary_last_name" name="secondary_last_name" type="text" data-tab="1"
                    defaultValue={prefill?.secondaryLastName ?? ""} className={INPUT} />
                </div>
              </div>
              <div>
                <label htmlFor="secondary_title" className={LABEL}>{t("contacts.secondary.title.label")}</label>
                <input id="secondary_title" name="secondary_title" type="text" data-tab="1"
                  defaultValue={prefill?.secondaryTitle ?? ""} className={INPUT} />
              </div>
              <div>
                <label htmlFor="secondary_email" className={LABEL}>{t("contacts.secondary.email.label")}</label>
                <input id="secondary_email" name="secondary_email" type="email" data-tab="1"
                  defaultValue={prefill?.secondaryEmail ?? ""} className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="secondary_phone" className={LABEL}>{t("contacts.secondary.phone.label")}</label>
                  <input id="secondary_phone" name="secondary_phone" type="tel" data-tab="1"
                    defaultValue={prefill?.secondaryPhone ?? ""} className={INPUT} />
                </div>
                <div>
                  <label htmlFor="secondary_cell" className={LABEL}>{t("contacts.secondary.cell.label")}</label>
                  <input id="secondary_cell" name="secondary_cell" type="tel" data-tab="1"
                    defaultValue={prefill?.secondaryCell ?? ""} className={INPUT} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
