"use client";

import { useState, useRef } from "react";
import { usePrpEdit } from "./PrpEditContext";

interface Props {
  contentKey: string;
  value: string;
  className?: string;
}

export function PrpEditableString({ contentKey, value, className }: Props) {
  const { isDraft, language, section } = usePrpEdit();
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState(value);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/prp/strings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, key: contentKey, language, value: draft }),
      });
      if (res.ok) {
        setCurrent(draft);
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!isDraft) {
    return <span className={className}>{current}</span>;
  }

  if (isEditing) {
    return (
      <span className={`inline-block ${className ?? ""}`}>
        <span className="inline-flex flex-col gap-1 border-2 border-purple-400 rounded p-1 bg-white shadow-lg">
          <span className="text-[10px] font-mono text-purple-600 px-1">{contentKey}</span>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="w-64 text-sm text-gray-900 px-1 py-0.5 border border-gray-200 rounded resize-y focus:outline-none"
          />
          <span className="flex gap-1 px-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-2 py-0.5 text-xs font-semibold bg-purple-700 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              onClick={() => { setDraft(current); setIsEditing(false); }}
              className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </span>
        </span>
      </span>
    );
  }

  return (
    <span
      className={`cursor-pointer border border-dashed border-purple-400 rounded px-0.5 hover:bg-purple-50 transition-colors group relative ${className ?? ""}`}
      onClick={() => { setDraft(current); setIsEditing(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
      title={`Edit: ${contentKey}`}
    >
      {current}
      <span className="absolute -top-1 -right-1 text-[10px] text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">✏</span>
    </span>
  );
}
