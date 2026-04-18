"use client";

/**
 * PbnImportPanel
 *
 * Provides two import paths for the NOC PbN allocation page:
 *  1. CSV file upload — opens a file picker, POSTs to /api/import/pbn
 *  2. Clipboard paste — shows a textarea for tab-separated rows from Excel/Sheets
 *
 * Only rendered when PbN is in draft state (isEditable=true).
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

export function PbnImportPanel() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"closed" | "paste">("closed");
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  async function submitImport(body: BodyInit, headers: Record<string, string>) {
    setLoading(true);
    setResult(null);
    setFileError(null);
    try {
      const res = await fetch("/api/import/pbn", {
        method: "POST",
        headers,
        body,
      });
      const data = (await res.json()) as ImportResult & { error?: string };
      if (!res.ok && data.error) {
        setFileError(data.error);
      } else {
        setResult(data);
        if (data.imported > 0 && data.errors.length === 0) {
          // All clean — refresh page to show updated allocations
          router.refresh();
        }
      }
    } catch {
      setFileError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    await submitImport(form, {});
    // Reset file input so the same file can be re-selected if needed
    e.target.value = "";
  }

  async function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    await submitImport(
      JSON.stringify({ text: pasteText }),
      { "Content-Type": "application/json" }
    );
  }

  function resetAll() {
    setMode("closed");
    setPasteText("");
    setResult(null);
    setFileError(null);
  }

  const hasErrors = (result?.errors.length ?? 0) > 0 || !!fileError;
  const allGood   = result && result.imported > 0 && !hasErrors;

  return (
    <div className="space-y-3">
      {/* Trigger buttons */}
      {mode === "closed" && !result && !fileError && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            aria-label="Import CSV file"
            onChange={handleFileChange}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            <span className="text-base leading-none">↑</span>
            Import CSV
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setMode("paste")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            <span className="text-base leading-none">⎘</span>
            Paste from spreadsheet
          </button>
        </div>
      )}

      {/* Clipboard paste panel */}
      {mode === "paste" && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Paste from spreadsheet</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Copy rows from Excel or Google Sheets (Ctrl+C / Cmd+C) and paste below.
                The first row must be a header row with at least an <code className="font-mono bg-gray-100 px-1 rounded">org_name</code> column.
              </p>
            </div>
            <button
              type="button"
              onClick={resetAll}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-4 shrink-0"
              aria-label="Close paste panel"
            >
              ×
            </button>
          </div>

          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"org_name\torg_type\tcountry\te_slots\tes_slots\tep_slots\teps_slots\tet_slots\tec_slots\nAP Wirephoto\tnews_agency\tUS\t4\t0\t2\t0\t1\t0"}
            rows={8}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            aria-label="Paste tab-separated spreadsheet data"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || !pasteText.trim()}
              onClick={handlePasteSubmit}
              className="px-4 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Importing…" : "Import"}
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Result feedback */}
      {(result || fileError) && (
        <div className={`rounded-lg border p-4 space-y-2 ${allGood ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              {result && (
                <p className={`text-sm font-semibold ${allGood ? "text-green-800" : "text-amber-800"}`}>
                  {result.imported} row{result.imported !== 1 ? "s" : ""} imported
                  {result.skipped > 0 && `, ${result.skipped} skipped`}
                </p>
              )}
              {fileError && (
                <p className="text-sm font-semibold text-red-700">{fileError}</p>
              )}
            </div>
            <button
              type="button"
              onClick={resetAll}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>

          {result && result.errors.length > 0 && (
            <ul className="text-xs text-amber-800 space-y-0.5 list-disc list-inside max-h-40 overflow-y-auto">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}

          {allGood && (
            <p className="text-xs text-green-700">
              Allocations updated. The page will refresh automatically.
            </p>
          )}
        </div>
      )}

      {loading && mode !== "paste" && (
        <p className="text-xs text-gray-500 animate-pulse">Importing…</p>
      )}
    </div>
  );
}
