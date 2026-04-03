"use client";

import { useState } from "react";
import { addIocDirectOrg } from "./actions";

const ORG_TYPES = [
  { value: "news_agency",        label: "News Agency" },
  { value: "media_broadcast",    label: "Broadcast" },
  { value: "media_print_online", label: "Print / Online Media" },
];

export function IocDirectAddPanel() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        Add IOC-Direct organisation
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Add IOC-Direct Organisation</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Creates an org record for PbN allocation and adds it to the reserved list —
            NOCs will be blocked from submitting a duplicate EoI for this org.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none" aria-label="Close">×</button>
      </div>

      <form action={addIocDirectOrg} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label htmlFor="direct-ioc-name" className="block text-xs font-medium text-gray-700 mb-1">
              Organisation name <span className="text-red-500">*</span>
            </label>
            <input
              id="direct-ioc-name" name="name" type="text" required
              placeholder="e.g. Agence France-Presse"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label htmlFor="direct-ioc-type" className="block text-xs font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="direct-ioc-type" name="orgType" required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select type…</option>
              {ORG_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="direct-ioc-country" className="block text-xs font-medium text-gray-700 mb-1">
              Country <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="direct-ioc-country" name="country" type="text"
              placeholder="e.g. FR"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
            />
          </div>

          <div>
            <label htmlFor="direct-ioc-domain" className="block text-xs font-medium text-gray-700 mb-1">
              Email domain <span className="text-gray-400 font-normal">(for dedup blocking)</span>
            </label>
            <input
              id="direct-ioc-domain" name="emailDomain" type="text"
              placeholder="e.g. afp.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label htmlFor="direct-ioc-website" className="block text-xs font-medium text-gray-700 mb-1">
              Website <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="direct-ioc-website" name="website" type="url"
              placeholder="https://afp.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="col-span-2">
            <label htmlFor="direct-ioc-notes" className="block text-xs font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="direct-ioc-notes" name="notes" type="text"
              placeholder="e.g. IOC recognised world news agency since 1945"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="px-4 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors"
          >
            Add Organisation
          </button>
          <button
            type="button" onClick={() => setOpen(false)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
