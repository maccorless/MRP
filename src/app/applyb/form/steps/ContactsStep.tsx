"use client";

import { FREELANCE_ORG_TYPES } from "@/lib/labels";
import type { PrefillData, FormErrors } from "../EoiFormWizard";
import { PhoneInput } from "@/components/PhoneInput";
import { makeT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const HELP  = "text-xs text-gray-500 mt-1";

function errBorder(name: string, errors?: FormErrors) {
  return errors?.[name] ? "border-red-500" : "border-gray-300";
}
function Err({ name, errors }: { name: string; errors?: FormErrors }) {
  if (!errors?.[name]) return null;
  return <p className="text-xs text-red-500 mt-1" role="alert">{errors[name]}</p>;
}

export function ContactsStep({
  prefill,
  email,
  errors,
  orgType,
  lang = "en",
}: {
  prefill: PrefillData | null;
  email: string;
  errors?: FormErrors;
  orgType: string;
  lang?: Lang;
}) {
  const t = makeT(lang);
  const eicOptional = FREELANCE_ORG_TYPES.has(orgType);

  return (
    <div className="space-y-8">
      {/* Primary contact */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
          {t("applyb.contact.primary.heading")}
        </h3>
        <p className={`${HELP} mb-4`}>
          {t("applyb.contact.primary.help")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact_first_name" className={LABEL}>
              {t("applyb.contact.first_name")} <span className="text-red-500">*</span>
            </label>
            <input
              id="contact_first_name" name="contact_first_name" type="text" required data-tab="1"
              defaultValue={prefill?.contactFirstName ?? ""}
              className={`${INPUT} ${errBorder("contact_first_name", errors)}`}
            />
            <Err name="contact_first_name" errors={errors} />
          </div>
          <div>
            <label htmlFor="contact_last_name" className={LABEL}>
              {t("applyb.contact.last_name")} <span className="text-red-500">*</span>
            </label>
            <input
              id="contact_last_name" name="contact_last_name" type="text" required data-tab="1"
              defaultValue={prefill?.contactLastName ?? ""}
              className={`${INPUT} ${errBorder("contact_last_name", errors)}`}
            />
            <Err name="contact_last_name" errors={errors} />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="contact_title" className={LABEL}>
            {t("applyb.contact.title")} <span className="text-red-500">*</span>
          </label>
          <input
            id="contact_title" name="contact_title" type="text" required data-tab="1"
            defaultValue={prefill?.contactTitle ?? ""}
            placeholder={t("applyb.contact.title.placeholder")}
            className={`${INPUT} ${errBorder("contact_title", errors)}`}
          />
          <Err name="contact_title" errors={errors} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="contact_email_display" className={LABEL}>
              {t("applyb.contact.email")} <span className="text-red-500">*</span>
            </label>
            <input
              id="contact_email_display"
              type="email"
              readOnly
              value={email}
              className={`${INPUT} bg-gray-50 text-gray-600 cursor-not-allowed`}
              aria-describedby="contact_email_help"
            />
            <p id="contact_email_help" className={HELP}>
              {t("applyb.contact.email.locked")}
            </p>
          </div>
          <div>
            <label htmlFor="contact_cell" className={LABEL}>
              {t("applyb.contact.cell")} <span className="text-red-500">*</span>
            </label>
            <PhoneInput
              id="contact_cell" name="contact_cell" required data-tab="1"
              defaultValue={prefill?.contactCell ?? ""}
              placeholder={t("applyb.contact.phone.placeholder")}
              className={`${INPUT} ${errBorder("contact_cell", errors)}`}
            />
            <p className={HELP}>{t("applyb.contact.phone.help")}</p>
            <Err name="contact_cell" errors={errors} />
          </div>
        </div>
      </section>

      {/* Editor-in-Chief */}
      <section className="border-t border-gray-100 pt-6">
        <div className="flex items-start justify-between mb-3 gap-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {t("applyb.contact.eic.heading")}
          </h3>
          {eicOptional && (
            <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 whitespace-nowrap">
              {t("applyb.contact.eic.optional")}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {eicOptional
            ? t("applyb.contact.eic.help.optional")
            : t("applyb.contact.eic.help.required")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="editor_in_chief_first_name" className={LABEL}>
              {t("applyb.contact.first_name")} {!eicOptional && <span className="text-red-500">*</span>}
            </label>
            <input
              id="editor_in_chief_first_name" name="editor_in_chief_first_name" type="text"
              required={!eicOptional} data-tab="1"
              className={`${INPUT} ${errBorder("editor_in_chief_first_name", errors)}`}
            />
            <Err name="editor_in_chief_first_name" errors={errors} />
          </div>
          <div>
            <label htmlFor="editor_in_chief_last_name" className={LABEL}>
              {t("applyb.contact.last_name")} {!eicOptional && <span className="text-red-500">*</span>}
            </label>
            <input
              id="editor_in_chief_last_name" name="editor_in_chief_last_name" type="text"
              required={!eicOptional} data-tab="1"
              className={`${INPUT} ${errBorder("editor_in_chief_last_name", errors)}`}
            />
            <Err name="editor_in_chief_last_name" errors={errors} />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="editor_in_chief_email" className={LABEL}>
            {t("applyb.contact.email")} {!eicOptional && <span className="text-red-500">*</span>}
          </label>
          <input
            id="editor_in_chief_email" name="editor_in_chief_email" type="email"
            required={!eicOptional} data-tab="1"
            placeholder={t("applyb.contact.eic.email.placeholder")}
            className={`${INPUT} ${errBorder("editor_in_chief_email", errors)}`}
          />
          <Err name="editor_in_chief_email" errors={errors} />
        </div>
      </section>
    </div>
  );
}
