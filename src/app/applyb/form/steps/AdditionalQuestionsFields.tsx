"use client";

import { useState } from "react";
import { FREELANCE_ORG_TYPES } from "@/lib/labels";
import type { PrefillData, FormErrors } from "../EoiFormWizard";
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

const SUMMER_EDITIONS = ["Sydney 2000", "Athens 2004", "Beijing 2008", "London 2012", "Rio 2016", "Tokyo 2020", "Paris 2024"];
const WINTER_EDITIONS = ["Salt Lake City 2002", "Turin 2006", "Vancouver 2010", "Sochi 2014", "PyeongChang 2018", "Beijing 2022"];

function editionVal(edition: string) {
  return edition.toLowerCase().replace(/\s+/g, "_");
}
function parseEditions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function AdditionalQuestionsFields({
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
  const [priorOlympic, setPriorOlympic] = useState<string>(
    prefill?.priorOlympic === true ? "yes" : prefill?.priorOlympic === false ? "no" : ""
  );
  const [olympicEditions, setOlympicEditions] = useState<string[]>(
    parseEditions(prefill?.priorOlympicYears)
  );
  const [pressCard, setPressCard] = useState<string>(
    prefill?.pressCard === true ? "yes" : prefill?.pressCard === false ? "no" : ""
  );
  const isFreelancer = FREELANCE_ORG_TYPES.has(orgType);

  function toggleOlympic(val: string, isChecked: boolean) {
    setOlympicEditions((prev) => (isChecked ? [...prev, val] : prev.filter((x) => x !== val)));
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className={LABEL}>
          {t("applyb.addl.prior.question")} <span className="text-red-500">*</span>
        </legend>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="prior_olympic" value="yes" data-tab="4"
              checked={priorOlympic === "yes"} onChange={() => setPriorOlympic("yes")}
              className="accent-brand-blue" /> {t("applyb.addl.yes")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="prior_olympic" value="no" data-tab="4"
              checked={priorOlympic === "no"} onChange={() => setPriorOlympic("no")}
              className="accent-brand-blue" /> {t("applyb.addl.no")}
          </label>
        </div>
        <Err name="prior_olympic" errors={errors} />
      </fieldset>

      {priorOlympic === "yes" && (
        <div className="pl-6 border-l-2 border-blue-200 space-y-4">
          <div>
            <label className={LABEL}>{t("applyb.addl.games.question")} <span className="text-red-500">*</span></label>
            <p className="text-xs text-gray-500 mb-2">{t("applyb.addl.summer.editions")}</p>
            <div className="flex flex-wrap gap-2">
              {SUMMER_EDITIONS.map((edition) => {
                const val = editionVal(edition);
                return (
                  <label key={val} className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={olympicEditions.includes(val)}
                      onChange={(e) => toggleOlympic(val, e.target.checked)}
                      data-tab="4"
                    />
                    {edition}
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-3 mb-2">{t("applyb.addl.winter.editions")}</p>
            <div className="flex flex-wrap gap-2">
              {WINTER_EDITIONS.map((edition) => {
                const val = editionVal(edition);
                return (
                  <label key={val} className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={olympicEditions.includes(val)}
                      onChange={(e) => toggleOlympic(val, e.target.checked)}
                      data-tab="4"
                    />
                    {edition}
                  </label>
                );
              })}
            </div>
            <input type="hidden" name="prior_olympic_years" value={olympicEditions.join(",")} />
          </div>
          <div>
            <label htmlFor="past_coverage_examples" className={LABEL}>
              {t("applyb.addl.coverage.yes.label")} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="past_coverage_examples" name="past_coverage_examples" rows={4} required data-tab="4"
              defaultValue={prefill?.pastCoverageExamples ?? ""}
              placeholder={t("applyb.addl.coverage.yes.placeholder")}
              className={`${INPUT} resize-none ${errBorder("past_coverage_examples", errors)}`}
            />
            <Err name="past_coverage_examples" errors={errors} />
          </div>
        </div>
      )}

      {priorOlympic === "no" && (
        <div className="pl-6 border-l-2 border-gray-200">
          <label htmlFor="past_coverage_examples_no_prior" className={LABEL}>
            {t("applyb.addl.coverage.no.label")} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="past_coverage_examples_no_prior" name="past_coverage_examples" rows={4} required data-tab="4"
            defaultValue={prefill?.pastCoverageExamples ?? ""}
            placeholder={t("applyb.addl.coverage.no.placeholder")}
            className={`${INPUT} resize-none ${errBorder("past_coverage_examples", errors)}`}
          />
          <Err name="past_coverage_examples" errors={errors} />
        </div>
      )}

      <fieldset>
        <legend className={LABEL}>
          {t("applyb.addl.press_card.question")}
          {isFreelancer && <span className="text-red-500"> *</span>}
        </legend>
        {!isFreelancer && (
          <p className="text-xs text-gray-500 mb-1">
            {t("applyb.addl.press_card.not_required")}
          </p>
        )}
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="press_card" value="yes" data-tab="4"
              checked={pressCard === "yes"} onChange={() => setPressCard("yes")}
              required={isFreelancer}
              className="accent-brand-blue" /> {t("applyb.addl.yes")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="press_card" value="no" data-tab="4"
              checked={pressCard === "no"} onChange={() => setPressCard("no")}
              required={isFreelancer}
              className="accent-brand-blue" /> {t("applyb.addl.no")}
          </label>
        </div>
        <Err name="press_card" errors={errors} />
      </fieldset>

      {pressCard === "yes" && (
        <div className="pl-6 border-l-2 border-blue-200">
          <label htmlFor="press_card_issuer" className={LABEL}>
            {t("applyb.addl.press_card.issuer.label")} <span className="text-red-500">*</span>
          </label>
          <input
            id="press_card_issuer" name="press_card_issuer" type="text" required data-tab="4"
            defaultValue={prefill?.pressCardIssuer ?? ""}
            placeholder={t("applyb.addl.press_card.issuer.placeholder")}
            className={`${INPUT} ${errBorder("press_card_issuer", errors)}`}
          />
          <Err name="press_card_issuer" errors={errors} />
        </div>
      )}

      <div>
        <label htmlFor="additional_comments" className={LABEL}>
          {t("applyb.addl.comments.label")}
        </label>
        <textarea
          id="additional_comments" name="additional_comments" rows={3} maxLength={500} data-tab="4"
          defaultValue={prefill?.additionalComments ?? ""}
          className={`${INPUT} resize-none`}
        />
        <p className={HELP}>{t("applyb.addl.char.max")}</p>
      </div>
    </div>
  );
}
