"use client";

import type { PrefillData } from "../EoiFormWizard";
import { makeT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

export function PublicationFields({
  prefill,
  orgType = "",
  lang = "en",
}: {
  prefill: PrefillData | null;
  orgType?: string;
  lang?: Lang;
}) {
  const t = makeT(lang);
  const isNonMrh = orgType === "non_mrh";

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        {t("applyb.pub.optional.help")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="circulation" className={LABEL}>
            {t("applyb.pub.circulation.label")}
          </label>
          <input
            id="circulation" name="circulation" type="text" data-tab="3"
            defaultValue={prefill?.circulation ?? ""}
            placeholder={t("applyb.pub.circulation.placeholder")}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="publication_frequency" className={LABEL}>
            {t("applyb.pub.frequency.label")}
          </label>
          <input
            id="publication_frequency" name="publication_frequency" type="text" data-tab="3"
            defaultValue={prefill?.publicationFrequency ?? ""}
            placeholder={t("applyb.pub.frequency.placeholder")}
            className={INPUT}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="online_unique_visitors" className={LABEL}>
            {t("applyb.pub.online.label")}
          </label>
          <input
            id="online_unique_visitors" name="online_unique_visitors" type="text" data-tab="3"
            defaultValue={prefill?.onlineUniqueVisitors ?? ""}
            placeholder={t("applyb.pub.online.placeholder")}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="geographical_coverage" className={LABEL}>
            {t("applyb.pub.geo.label")}
          </label>
          <select
            id="geographical_coverage" name="geographical_coverage" data-tab="3"
            defaultValue={prefill?.geographicalCoverage ?? ""}
            className={INPUT}
          >
            <option value="">{t("applyb.pub.geo.select")}</option>
            <option value="international">{t("applyb.pub.geo.international")}</option>
            <option value="national">{t("applyb.pub.geo.national")}</option>
            <option value="local">{t("applyb.pub.geo.local")}</option>
          </select>
        </div>
      </div>

      {isNonMrh && (
        <div>
          <p className="text-xs font-medium text-red-600 mb-1">
            {t("applyb.pub.enr.info")}
          </p>
          <label htmlFor="enr_programming_type" className={LABEL}>
            {t("applyb.pub.enr.label")} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="enr_programming_type" name="enr_programming_type" rows={2} data-tab="3"
            required
            defaultValue={prefill?.enrProgrammingType ?? ""}
            placeholder={t("applyb.pub.enr.placeholder")}
            className={`${INPUT} resize-none`}
          />
        </div>
      )}

      <div>
        <label htmlFor="social_media_accounts" className={LABEL}>
          {t("applyb.pub.social.label")}
        </label>
        <textarea
          id="social_media_accounts" name="social_media_accounts" rows={2} data-tab="3"
          defaultValue={prefill?.socialMediaAccounts ?? ""}
          placeholder={t("applyb.pub.social.placeholder")}
          className={`${INPUT} resize-none`}
        />
      </div>
    </div>
  );
}
