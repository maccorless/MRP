"use client";

import { useState } from "react";
import { usePrpEdit } from "./PrpEditContext";

const LANGUAGES = ["EN", "FR", "ES"] as const;

export function PrpAdminBar() {
  const { isDraft, setIsDraft, language, setLanguage, section } = usePrpEdit();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);

  async function handlePublish() {
    setIsPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch("/api/admin/prp/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, language }),
      });
      const data = await res.json() as { published?: number; error?: string };
      if (res.ok) {
        setPublishResult(`Published ${data.published ?? 0} strings`);
        setIsDraft(false);
      } else {
        setPublishResult(data.error ?? "Publish failed");
      }
    } catch {
      setPublishResult("Network error");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-purple-900 text-white text-xs flex items-center gap-3 px-4 py-1.5 shadow-md">
      <span className="font-semibold text-purple-300 uppercase tracking-wide">PRP Admin</span>
      <span className="text-purple-400">|</span>
      <span className="text-purple-200">Section: <span className="font-mono text-white">{section}</span></span>

      <span className="text-purple-400">|</span>

      {/* Language selector */}
      <div className="flex items-center gap-1">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
              language === lang
                ? "bg-purple-600 text-white"
                : "text-purple-300 hover:text-white hover:bg-purple-800"
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      <span className="text-purple-400">|</span>

      {/* Draft / Live toggle */}
      <button
        type="button"
        onClick={() => setIsDraft(!isDraft)}
        className={`px-2.5 py-0.5 rounded font-semibold transition-colors ${
          isDraft
            ? "bg-amber-500 text-amber-900 hover:bg-amber-400"
            : "bg-purple-700 text-purple-200 hover:bg-purple-600"
        }`}
      >
        {isDraft ? "Draft mode" : "Live mode"}
      </button>

      {isDraft && (
        <>
          <span className="text-purple-400">|</span>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-2.5 py-0.5 rounded font-semibold bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-50"
          >
            {isPublishing ? "Publishing…" : "Publish"}
          </button>
          {publishResult && (
            <span className="text-purple-200">{publishResult}</span>
          )}
        </>
      )}
    </div>
  );
}
