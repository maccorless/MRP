"use client";

import { useState } from "react";
import { APPLYB_ORG_TYPES, FREELANCE_ORG_TYPES } from "@/lib/labels";
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

export function OrganisationStep({
  prefill,
  errors,
  countryCodes,
  nocCodes,
  orgType,
  onOrgTypeChange,
  nocAutoSuggestedName,
  lang = "en",
}: {
  prefill: PrefillData | null;
  errors?: FormErrors;
  countryCodes: { code: string; name: string }[];
  nocCodes: { code: string; name: string }[];
  orgType: string;
  onOrgTypeChange: (value: string) => void;
  nocAutoSuggestedName: string | null;
  lang?: Lang;
}) {
  const t = makeT(lang);
  const [nonMrhType, setNonMrhType] = useState<string>("");
  const isNonMrh = orgType === "non_mrh";
  const isOther = orgType === "other";
  const isFreelance = FREELANCE_ORG_TYPES.has(orgType);

  return (
    <div className="space-y-6">
      {/* Organisation name */}
      <div>
        <label htmlFor="org_name" className={LABEL}>
          {t("applyb.org.name.label")} <span className="text-red-500">*</span>
        </label>
        <input
          id="org_name" name="org_name" type="text" required data-tab="0"
          defaultValue={prefill?.orgName ?? ""}
          placeholder={t("applyb.org.name.placeholder")}
          className={`${INPUT} ${errBorder("org_name", errors)}`}
        />
        <Err name="org_name" errors={errors} />
      </div>

      {/* Type of Press Organisation */}
      <div>
        <label htmlFor="org_type" className={LABEL}>
          {t("applyb.org.type.label")} <span className="text-red-500">*</span>
        </label>
        <select
          id="org_type" name="org_type" required data-tab="0"
          value={orgType} onChange={(e) => onOrgTypeChange(e.target.value)}
          className={`${INPUT} ${errBorder("org_type", errors)}`}
        >
          <option value="" disabled>{t("applyb.org.type.placeholder")}</option>
          {APPLYB_ORG_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <Err name="org_type" errors={errors} />
      </div>

      {/* Conditional: Other — specify */}
      {isOther && (
        <div>
          <label htmlFor="org_type_other" className={LABEL}>
            {t("applyb.org.type.other.label")} <span className="text-red-500">*</span>
          </label>
          <input
            id="org_type_other" name="org_type_other" type="text" required data-tab="0"
            defaultValue={prefill?.orgTypeOther ?? ""}
            className={`${INPUT} ${errBorder("org_type_other", errors)}`}
          />
          <Err name="org_type_other" errors={errors} />
        </div>
      )}

      {/* Conditional: Non-MRH sub-dropdown */}
      {isNonMrh && (
        <div className="pl-4 border-l-2 border-blue-200 space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
            {t("applyb.org.non_mrh.info")}
          </div>
          <div>
            <label htmlFor="non_mrh_media_type" className={LABEL}>
              {t("applyb.org.non_mrh.type.label")} <span className="text-red-500">*</span>
            </label>
            <select
              id="non_mrh_media_type" name="non_mrh_media_type" required data-tab="0"
              value={nonMrhType} onChange={(e) => setNonMrhType(e.target.value)}
              className={`${INPUT} ${errBorder("non_mrh_media_type", errors)}`}
            >
              <option value="" disabled>{t("applyb.org.non_mrh.type.placeholder")}</option>
              <option value="television">{t("applyb.org.non_mrh.television")}</option>
              <option value="radio">{t("applyb.org.non_mrh.radio")}</option>
              <option value="other">{t("applyb.org.non_mrh.other")}</option>
            </select>
            <Err name="non_mrh_media_type" errors={errors} />
          </div>
          {nonMrhType === "other" && (
            <div>
              <label htmlFor="non_mrh_media_type_other" className={LABEL}>
                {t("applyb.org.non_mrh.specify")} <span className="text-red-500">*</span>
              </label>
              <input
                id="non_mrh_media_type_other" name="non_mrh_media_type_other" type="text"
                required data-tab="0"
                className={`${INPUT} ${errBorder("non_mrh_media_type_other", errors)}`}
              />
              <Err name="non_mrh_media_type_other" errors={errors} />
            </div>
          )}
        </div>
      )}

      {/* Freelancer hint (press card question lives in Story/Additional step) */}
      {isFreelance && (
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-200">
          {t("applyb.org.freelancer.hint")}
        </div>
      )}

      {/* Website */}
      <div>
        <label htmlFor="website" className={LABEL}>
          {t("applyb.org.website.label")} <span className="text-red-500">*</span>
        </label>
        <input
          id="website" name="website" type="url" required data-tab="0"
          defaultValue={prefill?.orgWebsite ?? ""}
          placeholder={t("applyb.org.website.placeholder")}
          className={`${INPUT} ${errBorder("website", errors)}`}
        />
        <Err name="website" errors={errors} />
      </div>

      {/* Address — all mandatory except state/province */}
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">{t("applyb.org.address.heading")}</h3>
        <div>
          <label htmlFor="address" className={LABEL}>
            {t("applyb.org.address.label")} <span className="text-red-500">*</span>
          </label>
          <input
            id="address" name="address" type="text" required data-tab="0"
            placeholder={t("applyb.org.address.placeholder")}
            className={`${INPUT} ${errBorder("address", errors)}`}
          />
          <Err name="address" errors={errors} />
        </div>
        <div>
          <label htmlFor="address2" className={LABEL}>
            {t("applyb.org.address2.label")}
          </label>
          <input id="address2" name="address2" type="text" data-tab="0" className={INPUT} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:items-end">
          <div>
            <label htmlFor="city" className={LABEL}>
              {t("applyb.org.city.label")} <span className="text-red-500">*</span>
            </label>
            <input
              id="city" name="city" type="text" required data-tab="0"
              className={`${INPUT} ${errBorder("city", errors)}`}
            />
            <Err name="city" errors={errors} />
          </div>
          <div>
            <label htmlFor="state_province" className={LABEL}>
              {t("applyb.org.state.label")}
            </label>
            <input id="state_province" name="state_province" type="text" data-tab="0" className={INPUT} />
          </div>
          <div>
            <label htmlFor="postal_code" className={LABEL}>
              {t("applyb.org.postal.label")} <span className="text-red-500">*</span>
            </label>
            <input
              id="postal_code" name="postal_code" type="text" required data-tab="0"
              className={`${INPUT} ${errBorder("postal_code", errors)}`}
            />
            <Err name="postal_code" errors={errors} />
          </div>
        </div>
      </div>

      {/* Country + NOC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="country" className={LABEL}>
            {t("applyb.org.country.label")} <span className="text-red-500">*</span>
          </label>
          <input
            id="country" name="country" type="text" required data-tab="0" list="country-codes"
            placeholder={t("applyb.org.country.placeholder")}
            className={`${INPUT} ${errBorder("country", errors)}`}
          />
          <datalist id="country-codes">
            {countryCodes.map(({ code, name }) => (
              <option key={code} value={`${code} — ${name}`} />
            ))}
          </datalist>
          <Err name="country" errors={errors} />
        </div>
        <div>
          <label htmlFor="noc_code" className={LABEL}>
            {t("applyb.org.noc.label")} <span className="text-red-500">*</span>
          </label>
          <input
            id="noc_code" name="noc_code" type="text" required data-tab="0" list="noc-codes"
            placeholder={t("applyb.org.country.placeholder")}
            className={`${INPUT} ${errBorder("noc_code", errors)}`}
          />
          <datalist id="noc-codes">
            {nocCodes.map(({ code, name }) => (
              <option key={code} value={`${code} — ${name}`} />
            ))}
          </datalist>
          <Err name="noc_code" errors={errors} />
          {nocAutoSuggestedName ? (
            <p className="text-xs text-brand-blue mt-1">
              Auto-selected: <strong>{nocAutoSuggestedName}</strong>. Change if incorrect.
            </p>
          ) : (
            <p className={HELP}>
              {t("applyb.org.noc.help")}
            </p>
          )}
        </div>
      </div>

      {/* Org phone + email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="org_phone" className={LABEL}>
            {t("applyb.org.phone.label")} <span className="text-red-500">*</span>
          </label>
          <PhoneInput
            id="org_phone" name="org_phone" required data-tab="0"
            placeholder={t("applyb.org.phone.placeholder")}
            className={`${INPUT} ${errBorder("org_phone", errors)}`}
          />
          <p className={HELP}>{t("applyb.org.phone.help")}</p>
          <Err name="org_phone" errors={errors} />
        </div>
        <div>
          <label htmlFor="org_email" className={LABEL}>
            {t("applyb.org.email.label")} <span className="text-red-500">*</span>
          </label>
          <input
            id="org_email" name="org_email" type="email" required data-tab="0"
            defaultValue={prefill?.orgEmail ?? ""}
            placeholder={t("applyb.org.email.placeholder")}
            className={`${INPUT} ${errBorder("org_email", errors)}`}
          />
          <Err name="org_email" errors={errors} />
        </div>
      </div>
    </div>
  );
}
