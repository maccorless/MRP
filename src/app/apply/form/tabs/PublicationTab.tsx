"use client";

import { useState } from "react";
import type { PrefillData } from "../EoiFormTabs";

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent";
const BASE_INPUT = "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const HELP = "text-xs text-gray-400 mt-1";

const PUBLICATION_TYPES = [
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

export function PublicationTab({ prefill }: { prefill: PrefillData | null }) {
  const defaultTypes = (prefill?.publicationTypes as string[] | null) ?? [];
  const [otherChecked, setOtherChecked] = useState(
    prefill?.publicationTypes?.includes("other") ?? false
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        Help us understand your publication's reach and output. This information supports your NOC's evaluation
        and helps the IOC understand the media landscape for the Games.
      </div>

      {/* Publication types */}
      <div>
        <label className={LABEL}>Publication type <span className="text-gray-400 font-normal">(select all that apply)</span></label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {PUBLICATION_TYPES.map((type) => {
            const value = type.toLowerCase().replace(/[^a-z0-9]/g, "_");
            const isOther = value === "other";
            return (
              <label key={value} className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 has-[:checked]:border-[#0057A8] has-[:checked]:bg-blue-50 transition-colors text-sm">
                <input
                  type="checkbox"
                  name="publication_types"
                  value={value}
                  defaultChecked={defaultTypes.includes(value)}
                  data-tab="3"
                  className="accent-[#0057A8]"
                  onChange={isOther ? (e) => setOtherChecked(e.target.checked) : undefined}
                />
                {type}
              </label>
            );
          })}
        </div>
        {otherChecked && (
          <input
            name="publication_type_other"
            type="text"
            placeholder="Please specify..."
            className={BASE_INPUT + " border-gray-300 mt-2"}
            defaultValue={prefill?.publicationTypeOther ?? ""}
            data-tab="3"
          />
        )}
      </div>

      {/* Circulation + frequency */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="circulation" className={LABEL}>Circulation / unique visitors per month</label>
          <input id="circulation" name="circulation" type="text" data-tab="3"
            defaultValue={prefill?.circulation ?? ""} placeholder="e.g. 500,000 monthly visitors" className={INPUT} />
          <p className={HELP}>Print circulation or website unique visitors</p>
        </div>
        <div>
          <label htmlFor="publication_frequency" className={LABEL}>Frequency of publication</label>
          <input id="publication_frequency" name="publication_frequency" type="text" data-tab="3"
            defaultValue={prefill?.publicationFrequency ?? ""} placeholder="e.g. Daily, Weekly, Monthly" className={INPUT} />
        </div>
      </div>

      {/* Sports */}
      <div>
        <label htmlFor="sports_to_cover" className={LABEL}>Which sports do you plan to cover at LA 2028?</label>
        <textarea id="sports_to_cover" name="sports_to_cover" rows={3} data-tab="3"
          defaultValue={prefill?.sportsToCover ?? ""}
          placeholder="e.g. Athletics, Swimming, Gymnastics, Basketball"
          className={`${INPUT} resize-none`} />
      </div>
    </div>
  );
}
