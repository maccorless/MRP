"use client";

import { useState } from "react";
import { createApiKey } from "./actions";

export function CreateKeyModal() {
  const [open, setOpen] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await createApiKey(fd);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setRawKey(result.rawKey);
    }
  }

  function handleClose() {
    setOpen(false);
    setRawKey(null);
    setError(null);
    window.location.reload();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-brand-blue text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Generate API Key
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            {rawKey ? (
              <>
                <h2 className="text-base font-semibold text-gray-900">Key created</h2>
                <p className="text-sm text-gray-600">
                  Copy this key now. It will not be shown again.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm break-all select-all">
                  {rawKey}
                </div>
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Done — I've copied the key
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900">Generate API Key</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin user email
                  </label>
                  <input
                    name="user_email"
                    type="email"
                    required
                    placeholder="noc@example.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    name="label"
                    type="text"
                    required
                    placeholder="Claude Desktop"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <p className="text-xs text-gray-500 mt-1">A name to identify where this key is used.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires (optional)
                  </label>
                  <input
                    name="expires_at"
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank for no expiry.</p>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Generating…" : "Generate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
