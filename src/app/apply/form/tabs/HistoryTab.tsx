"use client";

import { useState } from "react";
import type { PrefillData } from "../EoiFormTabs";
import { makeT, type Lang } from "@/lib/i18n";

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const HELP = "text-xs text-gray-400 mt-1";

const SUMMER_EDITIONS = ["Sydney 2000", "Athens 2004", "Beijing 2008", "London 2012", "Rio 2016", "Tokyo 2020", "Paris 2024"];
const WINTER_EDITIONS = ["Salt Lake City 2002", "Turin 2006", "Vancouver 2010", "Sochi 2014", "PyeongChang 2018", "Beijing 2022"];

function editionVal(edition: string) {
  return edition.toLowerCase().replace(/\s+/g, "_");
}

function parseEditions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function EditionCheckboxes({
  editions,
  checked,
  onChange,
}: {
  editions: string[];
  checked: string[];
  onChange: (val: string, isChecked: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {editions.map((edition) => {
        const val = editionVal(edition);
        return (
          <label
            key={val}
            className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-100"
          >
            <input
              type="checkbox"
              checked={checked.includes(val)}
              onChange={(e) => onChange(val, e.target.checked)}
              data-tab="4"
              className="rounded"
            />
            {edition}
          </label>
        );
      })}
    </div>
  );
}

export function HistoryTab({ prefill, lang = "en" }: { prefill: PrefillData | null; lang?: Lang }) {
  const t = makeT(lang);
  const [priorOlympic, setPriorOlympic] = useState<string>(
    prefill?.priorOlympic === true ? "yes" : prefill?.priorOlympic === false ? "no" : ""
  );
  const [priorParalympic, setPriorParalympic] = useState<string>(
    prefill?.priorParalympic === true ? "yes" : prefill?.priorParalympic === false ? "no" : ""
  );

  const [olympicEditions, setOlympicEditions] = useState<string[]>(
    parseEditions(prefill?.priorOlympicYears)
  );
  const [paralympicEditions, setParalympicEditions] = useState<string[]>(
    parseEditions(prefill?.priorParalympicYears)
  );

  const noPrior = priorOlympic === "no" && priorParalympic === "no";

  function toggleOlympic(val: string, isChecked: boolean) {
    setOlympicEditions((prev) =>
      isChecked ? [...prev, val] : prev.filter((x) => x !== val)
    );
  }

  function toggleParalympic(val: string, isChecked: boolean) {
    setParalympicEditions((prev) =>
      isChecked ? [...prev, val] : prev.filter((x) => x !== val)
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        {t("history.intro")}
      </div>

      {/* Olympic history */}
      <fieldset>
        <legend className={LABEL}>{t("history.olympic.legend")}</legend>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="prior_olympic" value="yes" data-tab="4"
              checked={priorOlympic === "yes"} onChange={() => setPriorOlympic("yes")} className="accent-[#0057A8]" /> {t("history.olympic.yes")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="prior_olympic" value="no" data-tab="4"
              checked={priorOlympic === "no"} onChange={() => setPriorOlympic("no")} className="accent-[#0057A8]" /> {t("history.olympic.no")}
          </label>
        </div>
      </fieldset>

      {priorOlympic === "yes" && (
        <div className="pl-6 border-l-2 border-blue-200 space-y-4">
          <div>
            <label className={LABEL}>{t("history.olympic.years.label")}</label>
            <p className="text-xs text-gray-500 mb-2">{t("history.olympic.summer")}</p>
            <EditionCheckboxes
              editions={SUMMER_EDITIONS}
              checked={olympicEditions}
              onChange={toggleOlympic}
            />
            <p className="text-xs text-gray-500 mt-3 mb-2">{t("history.olympic.winter")}</p>
            <EditionCheckboxes
              editions={WINTER_EDITIONS}
              checked={olympicEditions}
              onChange={toggleOlympic}
            />
            <input type="hidden" name="prior_olympic_years" value={olympicEditions.join(",")} />
          </div>
          <div>
            <label htmlFor="past_coverage_examples" className={LABEL}>{t("history.olympic.coverage.label")}</label>
            <textarea id="past_coverage_examples" name="past_coverage_examples" rows={3} data-tab="4"
              defaultValue={prefill?.pastCoverageExamples ?? ""}
              placeholder={t("history.olympic.coverage.placeholder")}
              className={`${INPUT} resize-none`} />
            <p className={HELP}>{t("history.olympic.coverage.help")}</p>
          </div>
        </div>
      )}

      {/* Paralympic history */}
      <fieldset>
        <legend className={LABEL}>{t("history.paralympic.legend")}</legend>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="prior_paralympic" value="yes" data-tab="4"
              checked={priorParalympic === "yes"} onChange={() => setPriorParalympic("yes")} className="accent-[#0057A8]" /> {t("history.paralympic.yes")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="prior_paralympic" value="no" data-tab="4"
              checked={priorParalympic === "no"} onChange={() => setPriorParalympic("no")} className="accent-[#0057A8]" /> {t("history.paralympic.no")}
          </label>
        </div>
      </fieldset>

      {priorParalympic === "yes" && (
        <div className="pl-6 border-l-2 border-blue-200 space-y-4">
          <div>
            <label className={LABEL}>{t("history.olympic.years.label")}</label>
            <p className="text-xs text-gray-500 mb-2">{t("history.olympic.summer")}</p>
            <EditionCheckboxes
              editions={SUMMER_EDITIONS}
              checked={paralympicEditions}
              onChange={toggleParalympic}
            />
            <p className="text-xs text-gray-500 mt-3 mb-2">{t("history.olympic.winter")}</p>
            <EditionCheckboxes
              editions={WINTER_EDITIONS}
              checked={paralympicEditions}
              onChange={toggleParalympic}
            />
            <input type="hidden" name="prior_paralympic_years" value={paralympicEditions.join(",")} />
          </div>
        </div>
      )}

      {/* No prior accreditation — tell us about other coverage */}
      {noPrior && (
        <div className="pl-6 border-l-2 border-gray-200">
          <label htmlFor="past_coverage_fallback" className={LABEL}>
            {t("history.noPrior.label")}
          </label>
          <textarea id="past_coverage_fallback" name="past_coverage_examples" rows={3} data-tab="4"
            defaultValue={prefill?.pastCoverageExamples ?? ""}
            placeholder={t("history.noPrior.placeholder")}
            className={`${INPUT} resize-none`} />
        </div>
      )}

      {/* Additional information */}
      <div className="border-t border-gray-100 pt-6">
        <label htmlFor="additional_comments" className={LABEL}>{t("history.additional.label")}</label>
        <textarea id="additional_comments" name="additional_comments" rows={3} data-tab="4"
          defaultValue={prefill?.additionalComments ?? ""}
          placeholder={t("history.additional.placeholder")}
          className={`${INPUT} resize-none`} />
        <p className={HELP}>{t("history.additional.help")}</p>
      </div>
    </div>
  );
}
