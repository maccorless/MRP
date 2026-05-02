"use client";

import { useState } from "react";
import { COUNTRY_CODES } from "@/lib/codes";
import { LA28_SPORTS } from "@/lib/sports";

const ORG_TYPE_OPTIONS = [
  { value: "media_print_online", label: "Print / Online" },
  { value: "media_broadcast",    label: "Broadcast" },
  { value: "news_agency",        label: "News Agency" },
  { value: "enr",                label: "Non-Media Rights-Holder (ENR)" },
];

// Access scopes per Emma feedback 2026-04-24 (comment #71). Surfaced
// inline so NOC admins see what each category's accreditation actually
// grants without leaving the form.
const CATEGORIES: { key: string; label: string; sub: string; access: string }[] = [
  { key: "e",   label: "E",   sub: "Journalist",                      access: "ALL competition venues" },
  { key: "es",  label: "Es",  sub: "Sport-specific journalist",       access: "Own sport venues only" },
  { key: "ep",  label: "EP",  sub: "Photographer",                    access: "ALL competition venues" },
  { key: "eps", label: "EPs", sub: "Sport-specific photographer",     access: "Own sport venues only" },
  { key: "et",  label: "ET",  sub: "Technician",                      access: "ALL venues, no seating" },
  { key: "ec",  label: "EC",  sub: "Support staff",                   access: "MPC only" },
];

export type DirectEntryStrings = {
  org_section: string;
  contact_section: string;
  secondary_section: string;
  accreditation_section: string;
  notes_section: string;
  org_name: string;
  type: string;
  country: string;
  website: string;
  full_name: string;
  first_name: string;
  last_name: string;
  title_position: string;
  phone: string;
  cell_mobile: string;
  add_secondary: string;
  remove_secondary: string;
  submit_accept: string;
  notes_optional: string;
  notes_placeholder: string;
  select_prompt: string;
  select_sport: string;
  sport_field: string;
  access_label: string;
};

interface Props {
  action: (formData: FormData) => Promise<void>;
  nocCode: string;
  strings: DirectEntryStrings;
}

export default function DirectEntryForm({ action, strings: s }: Props) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showSecondary, setShowSecondary] = useState(false);
  const [selectedOrgType, setSelectedOrgType] = useState("");

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
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{s.org_section}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">
              {s.org_name} <span className="text-red-500">*</span>
            </label>
            <input
              name="org_name" type="text" required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {s.type} <span className="text-red-500">*</span>
            </label>
            <select
              name="org_type" required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              onChange={(e) => setSelectedOrgType(e.target.value)}
            >
              <option value="">{s.select_prompt}</option>
              {ORG_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {s.country}{" "}
              {selectedOrgType === "enr"
                ? <span className="text-gray-400">(optional — ENR orgs are non-geographic)</span>
                : <span className="text-red-500">*</span>
              }
            </label>
            <input
              name="country" type="text" list="country-list"
              required={selectedOrgType !== "enr"}
              placeholder="e.g. US"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <datalist id="country-list">
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </datalist>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">{s.website}</label>
            <input
              name="website" type="url" placeholder="https://" defaultValue="https://"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{s.contact_section}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {s.full_name} <span className="text-red-500">*</span>
            </label>
            <input
              name="contact_name" type="text" required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              name="contact_email" type="email" required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>

        {!showSecondary && (
          <button
            type="button"
            onClick={() => setShowSecondary(true)}
            className="text-sm text-brand-blue hover:underline"
          >
            {s.add_secondary}
          </button>
        )}

        {showSecondary && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{s.secondary_section}</h3>
              <button
                type="button"
                onClick={() => setShowSecondary(false)}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                {s.remove_secondary}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{s.first_name}</label>
                <input
                  name="secondary_first_name" type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{s.last_name}</label>
                <input
                  name="secondary_last_name" type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">{s.title_position}</label>
                <input
                  name="secondary_title" type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input
                  name="secondary_email" type="email"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{s.phone}</label>
                <input
                  name="secondary_phone" type="tel"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{s.cell_mobile}</label>
                <input
                  name="secondary_cell" type="tel"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{s.accreditation_section}</h2>
        <p className="text-xs text-gray-500">Select all that apply and enter requested slot quantities.</p>
        <div className="space-y-3">
          {CATEGORIES.map(({ key, label, sub, access }) => (
            <div key={key} className="flex items-start gap-4">
              <label className="flex items-start gap-2 w-72 cursor-pointer">
                <input
                  type="checkbox" name={`category_${key}`}
                  className="rounded border-gray-300 text-blue-600 mt-0.5"
                  onChange={(e) => toggleCategory(key, e.target.checked)}
                />
                <span className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                  <span className="text-xs text-gray-500 ml-2">{sub}</span>
                  <span className="block text-[11px] text-gray-400 leading-snug mt-0.5">{s.access_label}: {access}</span>
                </span>
              </label>
              <input
                type="number" name={`requested_${key}`}
                min={0} placeholder="slots"
                aria-label={`${label} (${sub}) — requested slots`}
                className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue mt-0.5"
              />
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 border-t border-gray-100 pt-3 leading-relaxed">
          <span className="font-medium text-gray-700">NOC E and NOC Es</span> (press attaché categories) are allocated to your own NOC Communications Staff record on the Press by Number screen, not selected here. Press attachés can <em>only</em> hold NOC E / NOC Es accreditation; do not allocate E, EP, or other categories to your own staff.
        </div>

        {showSportPicker && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {s.sport_field} <span className="text-red-500">*</span>
            </label>
            <select
              name="sports_specific_sport"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="">{s.select_sport}</option>
              {LA28_SPORTS.map((sport) => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{s.notes_section}</h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            {s.notes_optional}
          </label>
          <textarea
            name="about" rows={3}
            placeholder={s.notes_placeholder}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="px-5 py-2 bg-brand-blue text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer"
        >
          {s.submit_accept}
        </button>
        <span className="text-xs text-gray-400">
          This application will be immediately accepted as a candidate and added to the PbN queue.
        </span>
      </div>
    </form>
  );
}
