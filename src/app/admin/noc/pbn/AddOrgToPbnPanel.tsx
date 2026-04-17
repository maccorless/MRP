"use client";

import { useState } from "react";
import { addOrgDirectlyToPbn } from "./actions";

const ORG_TYPES = [
  { value: "news_agency",        label: "News Agency" },
  { value: "media_broadcast",    label: "Broadcast" },
  { value: "media_print_online", label: "Print / Online Media" },
  { value: "enr",                label: "ENR (Non-Rights Broadcaster)" },
];

export function AddOrgToPbnPanel() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        Add responsible organisation directly to PbN
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Add Responsible Organisation Directly</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            For ROs entering PbN without an EoI application — e.g. your national broadcaster or a known returning organisation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <form action={addOrgDirectlyToPbn} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <label htmlFor="direct-name" className="block text-xs font-medium text-gray-700 mb-1">
            Responsible Organisation name <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="direct-name"
            name="name"
            type="text"
            required
            placeholder="e.g. Deutsche Presse-Agentur"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="min-w-44">
          <label htmlFor="direct-orgType" className="block text-xs font-medium text-gray-700 mb-1">
            Type <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <select
            id="direct-orgType"
            name="orgType"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select type…</option>
            {ORG_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-28">
          <label htmlFor="direct-country" className="block text-xs font-medium text-gray-700 mb-1">
            Country <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="direct-country"
            name="country"
            type="text"
            placeholder="e.g. DE"
            maxLength={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors"
          >
            Add to PbN
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      <p className="mt-3 text-xs text-gray-400">
        All categories are available for allocation. Slot totals still count against your quota.
        This RO is logged in the audit trail as a NOC direct entry.
      </p>
    </div>
  );
}
