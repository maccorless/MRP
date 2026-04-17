"use client";

import { useState } from "react";
import { COUNTRY_CODES } from "@/lib/codes";
import { LA28_SPORTS } from "@/lib/sports";

const ORG_TYPE_OPTIONS = [
  { value: "media_print_online", label: "Print / Online" },
  { value: "media_broadcast",    label: "Broadcast" },
  { value: "news_agency",        label: "News Agency" },
];

const CATEGORIES: { key: string; label: string; sub: string }[] = [
  { key: "e",   label: "E",   sub: "Journalist" },
  { key: "es",  label: "Es",  sub: "Sport-Specific Journalist" },
  { key: "ep",  label: "EP",  sub: "Photographer" },
  { key: "eps", label: "EPs", sub: "Sport-Specific Photographer" },
  { key: "et",  label: "ET",  sub: "Technician" },
  { key: "ec",  label: "EC",  sub: "Support Staff" },
];

interface Props {
  action: (formData: FormData) => Promise<void>;
  nocCode: string;
}

export default function DirectEntryForm({ action }: Props) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showSecondary, setShowSecondary] = useState(false);

  const toggleCategory = (key: string, checked: boolean) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const showSportPicker = selectedCategories.has("es") || selectedCategories.has("eps");

  return (
    <form action={action} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Organisation</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">
              Organisation name <span className="text-red-500">*</span>
            </label>
            <input
              name="org_name" type="text" required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              name="org_type" required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
            >
              <option value="">— Select —</option>
              {ORG_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              name="country" type="text" list="country-list" required
              placeholder="e.g. US"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
            />
            <datalist id="country-list">
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </datalist>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Website</label>
            <input
              name="website" type="url" placeholder="https://" defaultValue="https://"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Primary Contact</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              name="contact_name" type="text" required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              name="contact_email" type="email" required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
            />
          </div>
        </div>

        {!showSecondary && (
          <button
            type="button"
            onClick={() => setShowSecondary(true)}
            className="text-sm text-[#0057A8] hover:underline"
          >
            + Add Editor-in-Chief / Media Manager
          </button>
        )}

        {showSecondary && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Editor-in-Chief / Media Manager</h3>
              <button
                type="button"
                onClick={() => setShowSecondary(false)}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                − Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">First name</label>
                <input
                  name="secondary_first_name" type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Last name</label>
                <input
                  name="secondary_last_name" type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Title / position</label>
                <input
                  name="secondary_title" type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input
                  name="secondary_email" type="email"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone</label>
                <input
                  name="secondary_phone" type="tel"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cell / mobile</label>
                <input
                  name="secondary_cell" type="tel"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Accreditation Categories</h2>
        <p className="text-xs text-gray-500">Select all that apply and enter requested slot quantities.</p>
        <div className="space-y-3">
          {CATEGORIES.map(({ key, label, sub }) => (
            <div key={key} className="flex items-center gap-4">
              <label className="flex items-center gap-2 w-56 cursor-pointer">
                <input
                  type="checkbox" name={`category_${key}`}
                  className="rounded border-gray-300 text-blue-600"
                  onChange={(e) => toggleCategory(key, e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-900">{label}</span>
                <span className="text-xs text-gray-500">{sub}</span>
              </label>
              <input
                type="number" name={`requested_${key}`}
                min={0} placeholder="slots"
                aria-label={`${label} (${sub}) — requested slots`}
                className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
              />
            </div>
          ))}
        </div>

        {showSportPicker && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Olympic sport (required for Es / EPs) <span className="text-red-500">*</span>
            </label>
            <select
              name="sports_specific_sport"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8]"
            >
              <option value="">— Select sport —</option>
              {LA28_SPORTS.map((sport) => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notes</h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Notes (optional)
          </label>
          <textarea
            name="about" rows={3}
            placeholder="Internal context for this organisation (not shown to the applicant)"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="px-5 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer"
        >
          Submit &amp; Accept as Candidate
        </button>
        <span className="text-xs text-gray-400">
          This application will be immediately accepted as a candidate and added to the PbN queue.
        </span>
      </div>
    </form>
  );
}
