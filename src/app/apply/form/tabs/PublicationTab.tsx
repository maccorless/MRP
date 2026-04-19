"use client";

import { useState } from "react";
import type { PrefillData } from "../EoiFormTabs";
import { makeT, type Lang, type TranslationKey } from "@/lib/i18n";
import { BASE_INPUT, INPUT, LABEL, HELP } from "../form-styles";

// Map from display name to translation key suffix
const PUBLICATION_TYPES: string[] = [
  "App",
  "Editorial Website / Blog",
  "Email Newsletter",
  "Magazine / Newspaper",
  "Official NGB Publication",
  "Photo Journal / Online Gallery",
  "Podcast",
  "Print Newsletter",
  "Social Media",
  "Television / Broadcast",
  "Online Video / Streaming",
  "Freelancer with confirmed assignment",
  "Other",
];

export function PublicationTab({ prefill, lang = "en" }: { prefill: PrefillData | null; lang?: Lang }) {
  const t = makeT(lang);
  const defaultTypes = (prefill?.publicationTypes as string[] | null) ?? [];
  const [otherChecked, setOtherChecked] = useState(
    prefill?.publicationTypes?.includes("other") ?? false
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        {t("pub.intro")}
      </div>

      {/* Publication types */}
      <div>
        <label className={LABEL}>
          {t("pub.types.label")} <span className="text-red-500" aria-hidden="true">*</span> <span className="text-gray-400 font-normal">{t("pub.types.selectAll")}</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {PUBLICATION_TYPES.map((type) => {
            const value = type.toLowerCase().replace(/[^a-z0-9]/g, "_");
            const isOther = value === "other";
            const label = t(`pub.types.${type}` as TranslationKey) ?? type;
            return (
              <label key={value} className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 has-[:checked]:border-brand-blue has-[:checked]:bg-blue-50 transition-colors text-sm">
                <input
                  type="checkbox"
                  name="publication_types"
                  value={value}
                  defaultChecked={defaultTypes.includes(value)}
                  data-tab="3"
                  className="accent-brand-blue"
                  onChange={isOther ? (e) => setOtherChecked(e.target.checked) : undefined}
                />
                {label}
              </label>
            );
          })}
        </div>
        {otherChecked && (
          <input
            name="publication_type_other"
            type="text"
            placeholder={t("pub.types.other.placeholder")}
            className={BASE_INPUT + " border-gray-300 mt-2"}
            defaultValue={prefill?.publicationTypeOther ?? ""}
            data-tab="3"
          />
        )}
      </div>

      {/* Circulation + frequency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="circulation" className={LABEL}>{t("pub.circulation.label")}</label>
          <input id="circulation" name="circulation" type="text" data-tab="3"
            defaultValue={prefill?.circulation ?? ""} placeholder={t("pub.circulation.placeholder")} className={INPUT} />
          <p className={HELP}>{t("pub.circulation.help")}</p>
        </div>
        <div>
          <label htmlFor="pub-online-visitors" className="block text-xs font-medium text-gray-700 mb-1">
            {t("pub.onlineVisitors.label")} <span className="text-gray-400 font-normal">{t("pub.onlineVisitors.optional")}</span>
          </label>
          <input
            id="pub-online-visitors"
            name="online_unique_visitors"
            type="text"
            placeholder={t("pub.onlineVisitors.placeholder")}
            defaultValue={prefill?.onlineUniqueVisitors ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      {/* Geographical coverage */}
      <div>
        <label htmlFor="pub-geo-coverage" className="block text-xs font-medium text-gray-700 mb-1">
          {t("pub.geo.label")} <span className="text-gray-400 font-normal">{t("pub.geo.optional")}</span>
        </label>
        <select
          id="pub-geo-coverage"
          name="geographical_coverage"
          defaultValue={prefill?.geographicalCoverage ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
        >
          <option value="">{t("pub.geo.placeholder")}</option>
          <option value="international">{t("pub.geo.international")}</option>
          <option value="national">{t("pub.geo.national")}</option>
          <option value="local">{t("pub.geo.local")}</option>
        </select>
      </div>

      {/* Frequency */}
      <div>
        <label htmlFor="publication_frequency" className={LABEL}>{t("pub.frequency.label")}</label>
        <input id="publication_frequency" name="publication_frequency" type="text" data-tab="3"
          defaultValue={prefill?.publicationFrequency ?? ""} placeholder={t("pub.frequency.placeholder")} className={INPUT} />
      </div>

      {/* Social media accounts */}
      <div>
        <label htmlFor="pub-social-media" className="block text-xs font-medium text-gray-700 mb-1">
          {t("pub.social.label")} <span className="text-gray-400 font-normal">{t("pub.social.optional")}</span>
        </label>
        <textarea
          id="pub-social-media"
          name="social_media_accounts"
          rows={2}
          placeholder={t("pub.social.placeholder")}
          defaultValue={prefill?.socialMediaAccounts ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
        />
      </div>

      {/* Sports */}
      <div>
        <label htmlFor="sports_to_cover" className={LABEL}>{t("pub.sports.label")}</label>
        <textarea id="sports_to_cover" name="sports_to_cover" rows={3} data-tab="3"
          defaultValue={prefill?.sportsToCover ?? ""}
          placeholder={t("pub.sports.placeholder")}
          className={`${INPUT} resize-none`} />
      </div>
    </div>
  );
}
