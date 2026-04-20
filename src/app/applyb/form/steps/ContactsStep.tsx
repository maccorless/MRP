"use client";

import { FREELANCE_ORG_TYPES } from "@/lib/labels";
import type { PrefillData, FormErrors } from "../EoiFormWizard";

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

export function ContactsStep({
  prefill,
  email,
  errors,
  orgType,
}: {
  prefill: PrefillData | null;
  email: string;
  errors?: FormErrors;
  orgType: string;
}) {
  const eicOptional = FREELANCE_ORG_TYPES.has(orgType);

  return (
    <div className="space-y-8">
      {/* Primary contact */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Primary Contact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact_first_name" className={LABEL}>
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contact_first_name" name="contact_first_name" type="text" required data-tab="1"
              defaultValue={prefill?.contactFirstName ?? ""}
              className={`${INPUT} ${errBorder("contact_first_name", errors)}`}
            />
            <Err name="contact_first_name" errors={errors} />
          </div>
          <div>
            <label htmlFor="contact_last_name" className={LABEL}>
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contact_last_name" name="contact_last_name" type="text" required data-tab="1"
              defaultValue={prefill?.contactLastName ?? ""}
              className={`${INPUT} ${errBorder("contact_last_name", errors)}`}
            />
            <Err name="contact_last_name" errors={errors} />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="contact_title" className={LABEL}>
            Job Title / Position <span className="text-red-500">*</span>
          </label>
          <input
            id="contact_title" name="contact_title" type="text" required data-tab="1"
            defaultValue={prefill?.contactTitle ?? ""}
            placeholder="e.g. Sports Editor"
            className={`${INPUT} ${errBorder("contact_title", errors)}`}
          />
          <Err name="contact_title" errors={errors} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="contact_email_display" className={LABEL}>
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="contact_email_display"
              type="email"
              readOnly
              value={email}
              className={`${INPUT} bg-gray-50 text-gray-600 cursor-not-allowed`}
              aria-describedby="contact_email_help"
            />
            <p id="contact_email_help" className={HELP}>
              This is the email you used to start your application. To change it, start a new application.
            </p>
          </div>
          <div>
            <label htmlFor="contact_cell" className={LABEL}>
              Phone (mobile) <span className="text-red-500">*</span>
            </label>
            <input
              id="contact_cell" name="contact_cell" type="tel" required data-tab="1"
              defaultValue={prefill?.contactCell ?? ""}
              placeholder="+1 555 123 4567"
              className={`${INPUT} ${errBorder("contact_cell", errors)}`}
            />
            <p className={HELP}>Include country code.</p>
            <Err name="contact_cell" errors={errors} />
          </div>
        </div>
      </section>

      {/* Editor-in-Chief */}
      <section className="border-t border-gray-100 pt-6">
        <div className="flex items-start justify-between mb-3 gap-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Editor-in-Chief / Media Organisation Manager
          </h3>
          {eicOptional && (
            <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 whitespace-nowrap">
              Optional for freelancers
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {eicOptional
            ? "If you have an Editor-in-Chief or commissioning editor, please list them. Otherwise leave blank."
            : "Please provide contact details for your Editor-in-Chief or Media Organisation Manager."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="editor_in_chief_first_name" className={LABEL}>
              First Name {!eicOptional && <span className="text-red-500">*</span>}
            </label>
            <input
              id="editor_in_chief_first_name" name="editor_in_chief_first_name" type="text"
              required={!eicOptional} data-tab="1"
              className={`${INPUT} ${errBorder("editor_in_chief_first_name", errors)}`}
            />
            <Err name="editor_in_chief_first_name" errors={errors} />
          </div>
          <div>
            <label htmlFor="editor_in_chief_last_name" className={LABEL}>
              Last Name {!eicOptional && <span className="text-red-500">*</span>}
            </label>
            <input
              id="editor_in_chief_last_name" name="editor_in_chief_last_name" type="text"
              required={!eicOptional} data-tab="1"
              className={`${INPUT} ${errBorder("editor_in_chief_last_name", errors)}`}
            />
            <Err name="editor_in_chief_last_name" errors={errors} />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="editor_in_chief_email" className={LABEL}>
            Email Address {!eicOptional && <span className="text-red-500">*</span>}
          </label>
          <input
            id="editor_in_chief_email" name="editor_in_chief_email" type="email"
            required={!eicOptional} data-tab="1"
            placeholder="editor@yournewsroom.com"
            className={`${INPUT} ${errBorder("editor_in_chief_email", errors)}`}
          />
          <Err name="editor_in_chief_email" errors={errors} />
        </div>
      </section>
    </div>
  );
}
