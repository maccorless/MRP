"use client";

import { useState } from "react";
import type { PrefillData, FormErrors } from "../EoiFormWizard";
import { makeT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const HELP  = "text-xs text-gray-500 mt-1";

type CatKey = "E" | "Es" | "EP" | "EPs" | "EC" | "ET" | "ENR";

type Cat = {
  key: CatKey;
  code: string;
  max: number;
  softMax?: number;
};

const CATEGORIES: Cat[] = [
  { key: "E",   code: "E",   max: 100 },
  { key: "Es",  code: "Es",  max: 100 },
  { key: "EP",  code: "EP",  max: 100 },
  { key: "EPs", code: "EPs", max: 100 },
  { key: "EC",  code: "Ec",  max: 100 },
  { key: "ET",  code: "ET",  max: 100 },
  { key: "ENR", code: "ENR", max: 100, softMax: 3 },
];

function initialValue(key: string, prefill: PrefillData | null): string {
  if (!prefill) return "0";
  const map: Record<string, number | null | undefined> = {
    E: prefill.requestedE,
    Es: prefill.requestedEs,
    EP: prefill.requestedEp,
    EPs: prefill.requestedEps,
    ET: prefill.requestedEt,
    EC: prefill.requestedEc,
  };
  const v = map[key];
  return typeof v === "number" ? String(v) : "0";
}

export function AccreditationStep({
  prefill,
  errors,
  orgType = "",
  lang = "en",
}: {
  prefill: PrefillData | null;
  errors?: FormErrors;
  orgType?: string;
  lang?: Lang;
}) {
  const t = makeT(lang);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.key, initialValue(c.key, prefill)]))
  );
  const [aboutLength, setAboutLength] = useState<number>(prefill?.about?.length ?? 0);

  const totalRequested = Object.values(values).reduce((s, v) => s + (parseInt(v, 10) || 0), 0);
  const isNonMrh = orgType === "non_mrh";

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 leading-relaxed">
        {t("applyb.acr.intro1")}
        <br /><br />
        {t("applyb.acr.intro2").split("0").map((part, i, arr) =>
          i < arr.length - 1 ? <span key={i}>{part}<b>0</b></span> : <span key={i}>{part}</span>
        )}
      </div>

      <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const enrLocked = cat.key === "ENR" && !isNonMrh;
          const numericValue = enrLocked ? "0" : values[cat.key];
          const titleKey = `applyb.acr.cat.${cat.key}.title` as Parameters<typeof t>[0];
          const descKey  = `applyb.acr.cat.${cat.key}.desc`  as Parameters<typeof t>[0];
          return (
            <div
              key={cat.key}
              className={`border border-gray-200 rounded-lg p-4 flex items-start gap-4 ${enrLocked ? "bg-gray-50" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-blue text-sm">{cat.code}</span>
                  <span className="font-medium text-gray-900">{t(titleKey)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{t(descKey)}</p>
                {enrLocked && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    {t("applyb.acr.enr.locked")}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <label htmlFor={`requested_${cat.key}`} className="block text-xs text-gray-500 mb-1 text-right">
                  {t("applyb.acr.requested")}
                </label>
                <input
                  id={`requested_${cat.key}`}
                  name={`requested_${cat.key}`}
                  type="number"
                  min={0}
                  max={cat.max}
                  required
                  data-tab="2"
                  value={numericValue}
                  disabled={enrLocked}
                  onChange={(e) => {
                    const n = e.target.value;
                    setValues((prev) => ({ ...prev, [cat.key]: n }));
                  }}
                  className={`w-20 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent ${enrLocked ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`}
                />
                {parseInt(values[cat.key], 10) > cat.max && (
                  <p className="text-xs text-red-600 mt-1">
                    The value must be less than or equal to {cat.max}.
                  </p>
                )}
                {cat.softMax !== undefined && parseInt(values[cat.key], 10) > cat.softMax && parseInt(values[cat.key], 10) <= cat.max && (
                  <p className="text-xs text-amber-700 mt-1 max-w-xs text-right">
                    The IOC only approves more than {cat.softMax} ENR slots for certain press organisations.
                  </p>
                )}
                <input
                  type="hidden"
                  name={`category_${cat.key}`}
                  value={(parseInt(numericValue, 10) || 0) > 0 ? "on" : ""}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalRequested === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          {t("applyb.acr.no.category")}
        </div>
      )}
      {errors?.category && (
        <p className="text-sm text-red-500" role="alert">{errors.category}</p>
      )}

      {/* Brief description — "about" */}
      <div className="border-t border-gray-100 pt-6">
        <label htmlFor="about" className={LABEL}>
          {t("applyb.acr.about.label")} <span className="text-red-500">*</span>
        </label>
        {(parseInt(values.Es ?? "0", 10) > 0 || parseInt(values.EPs ?? "0", 10) > 0) && (
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-2">
            {t("applyb.acr.about.multi_sport")}
          </p>
        )}
        <textarea
          id="about" name="about" required rows={5} maxLength={500} data-tab="2"
          defaultValue={prefill?.about ?? ""}
          onChange={(e) => setAboutLength(e.target.value.length)}
          placeholder={t("applyb.acr.about.placeholder")}
          className={`${INPUT} resize-none ${errors?.about ? "border-red-500" : ""}`}
        />
        <p className="text-right text-xs text-gray-400 mt-1">{aboutLength} / 500</p>
        <p className={HELP}>{t("applyb.acr.about.help")}</p>
        {errors?.about && <p className="text-xs text-red-500 mt-1" role="alert">{errors.about}</p>}
      </div>
    </div>
  );
}
