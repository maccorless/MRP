"use client";

import { useState } from "react";
import type { FormErrors, PrefillData } from "../EoiFormTabs";

const BASE_INPUT = "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent";
const INPUT = BASE_INPUT + " border-gray-300";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const HELP = "text-xs text-gray-400 mt-1";

function inp(name: string, errors?: FormErrors) {
  return `${BASE_INPUT} ${errors?.[name] ? "border-red-500" : "border-gray-300"}`;
}
function Err({ name, errors }: { name: string; errors?: FormErrors }) {
  if (!errors?.[name]) return null;
  return <p id={`err-${name}`} className="text-xs text-red-500 mt-1" role="alert">{errors[name]}</p>;
}

export function ContactsTab({
  prefill,
  email,
  errors,
}: {
  prefill: PrefillData | null;
  email: string;
  errors?: FormErrors;
}) {
  const hasSecondary = !!(prefill?.secondaryFirstName || prefill?.secondaryLastName);
  const [showSecondary, setShowSecondary] = useState(hasSecondary);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        The primary contact will receive all correspondence about this application, including status updates and any requests for corrections.
      </div>

      {/* Primary contact */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Primary Contact</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact_first_name" className={LABEL}>First name <span className="text-red-500">*</span></label>
              <input id="contact_first_name" name="contact_first_name" type="text" required data-tab="1"
                defaultValue={prefill?.contactFirstName ?? ""} placeholder="First" className={inp("contact_first_name", errors)}
                aria-invalid={!!errors?.contact_first_name} aria-describedby={errors?.contact_first_name ? "err-contact_first_name" : undefined} />
              <Err name="contact_first_name" errors={errors} />
            </div>
            <div>
              <label htmlFor="contact_last_name" className={LABEL}>Last name <span className="text-red-500">*</span></label>
              <input id="contact_last_name" name="contact_last_name" type="text" required data-tab="1"
                defaultValue={prefill?.contactLastName ?? ""} placeholder="Last" className={inp("contact_last_name", errors)}
                aria-invalid={!!errors?.contact_last_name} aria-describedby={errors?.contact_last_name ? "err-contact_last_name" : undefined} />
              <Err name="contact_last_name" errors={errors} />
            </div>
          </div>
          <div>
            <label htmlFor="contact_title" className={LABEL}>Position / Title</label>
            <input id="contact_title" name="contact_title" type="text" data-tab="1"
              defaultValue={prefill?.contactTitle ?? ""} placeholder="e.g. Sports Editor, Bureau Chief" className={INPUT} />
          </div>
          <div>
            <label htmlFor="contact_email_display" className={LABEL}>Email address</label>
            <input id="contact_email_display" type="email" value={email} disabled
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500" />
            <p className={HELP}>Verified via your access link. Cannot be changed.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact_phone" className={LABEL}>Office phone</label>
              <input id="contact_phone" name="contact_phone" type="tel" data-tab="1"
                defaultValue={prefill?.contactPhone ?? ""} placeholder="+1 212-555-0100" className={INPUT} />
            </div>
            <div>
              <label htmlFor="contact_cell" className={LABEL}>Cell phone</label>
              <input id="contact_cell" name="contact_cell" type="tel" data-tab="1"
                defaultValue={prefill?.contactCell ?? ""} placeholder="+1 212-555-0101" className={INPUT} />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary contact toggle */}
      <div className="border-t border-gray-100 pt-6">
        {!showSecondary ? (
          <button
            type="button"
            onClick={() => setShowSecondary(true)}
            className="text-sm text-[#0057A8] font-medium hover:underline cursor-pointer"
          >
            + Add Editor-in-Chief / Media Manager
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Editor-in-Chief / Media Organisation Manager</h3>
              <button
                type="button"
                onClick={() => setShowSecondary(false)}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Remove
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">
              The Editor-in-Chief or Media Manager who oversees the accredited team at your organisation.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="secondary_first_name" className={LABEL}>First name</label>
                  <input id="secondary_first_name" name="secondary_first_name" type="text" data-tab="1"
                    defaultValue={prefill?.secondaryFirstName ?? ""} className={INPUT} />
                </div>
                <div>
                  <label htmlFor="secondary_last_name" className={LABEL}>Last name</label>
                  <input id="secondary_last_name" name="secondary_last_name" type="text" data-tab="1"
                    defaultValue={prefill?.secondaryLastName ?? ""} className={INPUT} />
                </div>
              </div>
              <div>
                <label htmlFor="secondary_title" className={LABEL}>Position / Title</label>
                <input id="secondary_title" name="secondary_title" type="text" data-tab="1"
                  defaultValue={prefill?.secondaryTitle ?? ""} className={INPUT} />
              </div>
              <div>
                <label htmlFor="secondary_email" className={LABEL}>Email address</label>
                <input id="secondary_email" name="secondary_email" type="email" data-tab="1"
                  defaultValue={prefill?.secondaryEmail ?? ""} className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="secondary_phone" className={LABEL}>Office phone</label>
                  <input id="secondary_phone" name="secondary_phone" type="tel" data-tab="1"
                    defaultValue={prefill?.secondaryPhone ?? ""} className={INPUT} />
                </div>
                <div>
                  <label htmlFor="secondary_cell" className={LABEL}>Cell phone</label>
                  <input id="secondary_cell" name="secondary_cell" type="tel" data-tab="1"
                    defaultValue={prefill?.secondaryCell ?? ""} className={INPUT} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
