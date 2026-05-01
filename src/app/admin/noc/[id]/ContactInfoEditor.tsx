"use client";

import { useState } from "react";
import { updateContactInfo } from "@/app/admin/noc/actions";

interface Props {
  applicationId: string;
  initial: {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  };
}

export function ContactInfoEditor({ applicationId, initial }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 text-sm text-brand-blue underline"
      >
        Edit contact info
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await updateContactInfo(applicationId, form);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        window.location.reload();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 border border-amber-200 p-4 rounded bg-amber-50">
      <p className="text-sm font-semibold text-amber-800">
        Editing contact info — if email changes, the new contact receives a fresh magic link.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <label className="block text-sm">
        Name
        <input
          type="text"
          value={form.contactName}
          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </label>
      <label className="block text-sm">
        Email
        <input
          type="email"
          value={form.contactEmail}
          onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </label>
      <label className="block text-sm">
        Phone
        <input
          type="text"
          value={form.contactPhone}
          onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1 bg-brand-blue text-white rounded text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1 bg-gray-200 rounded text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
