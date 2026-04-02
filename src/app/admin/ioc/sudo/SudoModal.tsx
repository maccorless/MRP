"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { initiateSudo } from "./actions";

export default function SudoModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") { handleClose(); return; }
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  function handleOpen() {
    setOpen(true);
    setEmail("");
    setError(null);
  }

  function handleClose() {
    setOpen(false);
    setEmail("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await initiateSudo(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      // Open the sudo window
      window.open(result.url, "_blank", "noopener,noreferrer");
      handleClose();
    });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs text-blue-200 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1 rounded border border-white/20 cursor-pointer"
      >
        Act as user
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" aria-hidden="true" />
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="sudo-modal-title" ref={dialogRef}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 id="sudo-modal-title" className="text-base font-semibold text-gray-900 mb-1">Act as another user</h2>
            <p className="text-sm text-gray-500 mb-4">
              Opens a new read-only window as the specified admin user. You cannot
              save or submit data in sudo mode.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Admin email address
                </label>
                <input
                  name="target_email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="noc.admin@usopc.org"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={pending}
                  className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || !email}
                  className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {pending ? "Opening…" : "Open as user →"}
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
              This action is audit logged. The sudo session expires after 1 hour.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
