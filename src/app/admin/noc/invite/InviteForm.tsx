"use client";

import { useActionState, useRef } from "react";
import { createInvitation, type InviteActionState } from "./actions";

const ORG_TYPE_OPTIONS = [
  { value: "media_print_online", label: "Print / Online" },
  { value: "media_broadcast",    label: "Broadcast" },
  { value: "news_agency",        label: "News Agency" },
  { value: "freelancer",         label: "Freelancer" },
];

const INITIAL_STATE: InviteActionState = {
  inviteUrl: null,
  inviteId: null,
  error: null,
};

export function InviteForm({
  countryCodes,
  defaultCountry = "",
}: {
  countryCodes: { code: string; name: string }[];
  defaultCountry?: string;
}) {
  const [state, formAction, isPending] = useActionState(createInvitation, INITIAL_STATE);
  const copyRef = useRef<HTMLInputElement>(null);

  function handleCopy() {
    if (copyRef.current) {
      copyRef.current.select();
      navigator.clipboard.writeText(copyRef.current.value).catch(() => {
        document.execCommand("copy");
      });
    }
  }

  if (state.inviteUrl) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-800 mb-1">
            Invite link created
          </p>
          <p className="text-sm text-green-700">
            Share this link with the organisation. It expires in 7 days and can
            only be used once.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={copyRef}
            type="text"
            readOnly
            value={state.inviteUrl}
            className="flex-1 font-mono text-sm border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            Copy link
          </button>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-sm text-brand-blue hover:underline"
        >
          Create another invite
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {state.error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Organisation (pre-fill)
        </h2>
        <p className="text-xs text-gray-500">
          These fields will be pre-filled in the applicant&apos;s form. All are optional.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">
              Organisation name
            </label>
            <input
              name="org_name"
              type="text"
              placeholder="Reuters"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Organisation type
            </label>
            <select
              name="org_type"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="">— Select —</option>
              {ORG_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Country</label>
            <input
              name="country"
              type="text"
              list="invite-country-list"
              placeholder="e.g. GB"
              defaultValue={defaultCountry}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <datalist id="invite-country-list">
              {countryCodes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </datalist>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Website</label>
            <input
              name="website"
              type="url"
              placeholder="https://"
              defaultValue="https://"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Recipient
        </h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Recipient email{" "}
            <span className="text-gray-400">(optional — leave blank if unknown)</span>
          </label>
          <input
            name="recipient_email"
            type="email"
            placeholder="editor@organisation.com"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <p className="mt-1 text-xs text-gray-400">
            If left blank, the link will ask the recipient to enter their email before opening the form.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 bg-brand-blue text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create Invite Link"}
        </button>
      </div>
    </form>
  );
}
