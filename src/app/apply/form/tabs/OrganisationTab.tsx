"use client";

import { useState } from "react";
import type { FormErrors, PrefillData } from "../EoiFormTabs";
import { makeT, type Lang } from "@/lib/i18n";
import { BASE_INPUT, LABEL, HELP, inp, Err } from "../form-styles";

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
  const t = makeT(lang);
  const [orgType, setOrgType] = useState<string>(prefill?.orgType ?? "");
  const [pressCardHeld, setPressCardHeld] = useState<boolean | null>(prefill?.pressCard ?? null);

  if (isResubmission && prefill) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
          {t("org.readonly")}
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div><dt className="text-gray-500 text-xs">{t("org.readonly.organisation")}</dt><dd className="font-medium text-gray-900">{prefill.orgName}</dd></div>
          <div><dt className="text-gray-500 text-xs">{t("org.readonly.noc")}</dt><dd className="text-gray-900">{prefill.orgNocCode}</dd></div>
          <div><dt className="text-gray-500 text-xs">{t("org.readonly.country")}</dt><dd className="text-gray-900">{prefill.orgCountry}</dd></div>
          <div><dt className="text-gray-500 text-xs">{t("org.readonly.type")}</dt><dd className="text-gray-900">{prefill.orgType}</dd></div>
        </dl>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        {t("org.intro")}
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="org_name" className={LABEL}>
            {t("org.name.label")} <span className="text-red-500">*</span>
          </label>
          <input id="org_name" name="org_name" type="text" required data-tab="0"
            defaultValue={prefill?.orgName ?? ""} placeholder={t("org.name.placeholder")} className={inp("org_name", errors)}
            aria-invalid={!!errors?.org_name} aria-describedby={errors?.org_name ? "err-org_name" : undefined} />
          <Err name="org_name" errors={errors} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="website" className={LABEL}>{t("org.website.label")}</label>
          <input id="website" name="website" type="url" data-tab="0"
            defaultValue={prefill?.orgWebsite ?? "https://"} placeholder={t("org.website.placeholder")} className={inp("website", errors)}
            aria-invalid={!!errors?.website} aria-describedby={errors?.website ? "err-website" : undefined} />
          <Err name="website" errors={errors} />
        </div>
      </div>

      <div>
        <label htmlFor="org_type" className={LABEL}>
          {t("org.type.label")} <span className="text-red-500">*</span>
        </label>
        <select id="org_type" name="org_type" required data-tab="0"
          value={orgType} onChange={(e) => setOrgType(e.target.value)} className={inp("org_type", errors)}
          aria-invalid={!!errors?.org_type} aria-describedby={errors?.org_type ? "err-org_type" : undefined}>
          <option value="" disabled>{t("org.type.placeholder")}</option>
          <option value="media_print_online">{t("org.type.print")}</option>
          <option value="media_broadcast">{t("org.type.broadcast")}</option>
          <option value="news_agency">{t("org.type.newsAgency")}</option>
          <option value="freelancer">{t("org.type.freelancer")}</option>
          <option value="enr">{t("org.type.enr")}</option>
          <option value="other">{t("org.type.other")}</option>
        </select>
        <Err name="org_type" errors={errors} />

        {orgType === "enr" && (
          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            {t("org.enr.info")}
          </div>
        )}
      </div>

      {orgType === "other" && (
        <div>
          <label htmlFor="org-type-other" className="block text-sm font-medium text-gray-700 mb-1">
            {t("org.type.other.label")} <span className="text-red-500">*</span>
          </label>
          <input
            id="org-type-other"
            type="text"
            name="org_type_other"
            data-tab="0"
            placeholder={t("org.type.other.placeholder")}
            required
            defaultValue={prefill?.orgTypeOther ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="country" className={LABEL}>{t("org.country.label")} <span className="text-red-500">*</span></label>
          <input id="country" name="country" type="text" required data-tab="0"
            list="country-codes" placeholder={t("org.country.placeholder")} className={inp("country", errors)}
            aria-invalid={!!errors?.country} aria-describedby={errors?.country ? "err-country" : undefined} />
          <datalist id="country-codes">
            {countryCodes.map(({ code, name }) => (
              <option key={code} value={`${code} — ${name}`} />
            ))}
          </datalist>
          <Err name="country" errors={errors} />
          <p className={HELP}>{t("org.country.help")}</p>
        </div>
        <div>
          <label htmlFor="noc_code" className={LABEL}>
            {t("org.noc.label")} <span className="text-red-500">*</span>
          </label>
          <input id="noc_code" name="noc_code" type="text" required data-tab="0"
            list="noc-codes" placeholder={t("org.noc.placeholder")} className={inp("noc_code", errors)}
            aria-invalid={!!errors?.noc_code} aria-describedby="noc-help" />
          <datalist id="noc-codes">
            {nocCodes.map(({ code, name }) => (
              <option key={code} value={`${code} — ${name}`} />
            ))}
          </datalist>
          <Err name="noc_code" errors={errors} />
          {nocAutoSuggestedName ? (
            <p id="noc-help" className="text-xs text-brand-blue mt-1">
              {t("org.noc.autoSelected")} <strong>{nocAutoSuggestedName}</strong> {t("org.noc.autoSelectedSuffix")}
            </p>
          ) : (
            <p id="noc-help" className={HELP}>
              {t("org.noc.help")}
            </p>
          )}
        </div>
      </div>

      {/* Address (optional) */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {t("org.address.heading")} <span className="text-gray-400 font-normal">{t("org.address.optional")}</span>
        </h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="address" className="sr-only">Street address</label>
            <input id="address" name="address" type="text" data-tab="0" placeholder={t("org.address.street.placeholder")} className={BASE_INPUT + " border-gray-300"} />
          </div>
          <div>
            <label htmlFor="address2" className="sr-only">Suite, floor, building</label>
            <input id="address2" name="address2" type="text" data-tab="0" placeholder={t("org.address.suite.placeholder")} className={BASE_INPUT + " border-gray-300"} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="city" className="sr-only">City</label>
              <input id="city" name="city" type="text" data-tab="0" placeholder={t("org.address.city.placeholder")} className={BASE_INPUT + " border-gray-300"} />
            </div>
            <div>
              <label htmlFor="state_province" className="sr-only">State / Province</label>
              <input id="state_province" name="state_province" type="text" data-tab="0" placeholder={t("org.address.state.placeholder")} className={BASE_INPUT + " border-gray-300"} />
            </div>
            <div>
              <label htmlFor="postal_code" className="sr-only">Postal code</label>
              <input id="postal_code" name="postal_code" type="text" data-tab="0" placeholder={t("org.address.postal.placeholder")} className={BASE_INPUT + " border-gray-300"} />
            </div>
          </div>
        </div>
      </div>

      {/* Flags */}
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <fieldset>
          <legend className={LABEL}>{t("org.accessibility.legend")}</legend>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="accessibility_needs" value="yes" data-tab="0" className="accent-brand-blue" /> {t("org.accessibility.yes")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="accessibility_needs" value="no" data-tab="0" className="accent-brand-blue" defaultChecked /> {t("org.accessibility.no")}
            </label>
          </div>
          <p className={HELP}>{t("org.accessibility.help")}</p>
        </fieldset>
      </div>

      {/* Press card (freelancers only) */}
      {orgType === "freelancer" && (
        <fieldset className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
          <legend className="text-xs font-medium text-gray-700 px-1">{t("org.pressCard.legend")}</legend>
          <div className="mt-2">
            <p className="text-xs text-gray-700 mb-2">{t("org.pressCard.question")} <span className="text-red-500">*</span></p>
            <label className="inline-flex items-center gap-1.5 text-sm mr-4">
              <input type="radio" name="press_card" value="yes" data-tab="0" defaultChecked={prefill?.pressCard === true} onChange={() => setPressCardHeld(true)} required />
              {t("org.pressCard.yes")}
            </label>
            <label className="inline-flex items-center gap-1.5 text-sm">
              <input type="radio" name="press_card" value="no" data-tab="0" defaultChecked={prefill?.pressCard === false} onChange={() => setPressCardHeld(false)} />
              {t("org.pressCard.no")}
            </label>
          </div>
          {pressCardHeld && (
            <div className="mt-3">
              <label htmlFor="press-card-issuer" className="block text-xs font-medium text-gray-700 mb-1">
                {t("org.pressCard.issuer.label")} <span className="text-red-500">*</span>
              </label>
              <input
                id="press-card-issuer"
                type="text"
                name="press_card_issuer"
                data-tab="0"
                placeholder={t("org.pressCard.issuer.placeholder")}
                required
                defaultValue={prefill?.pressCardIssuer ?? ""}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          )}
        </fieldset>
      )}
    </div>
  );
}
