"use client";

import { useTransition } from "react";
import { publishPbnResults, unpublishPbnResults } from "./actions";

type PbnPublishStrings = {
  title:           string;
  published_desc:  string;
  unpublished_desc: string;
  saving:          string;
  unpublish:       string;
  publish:         string;
  before_publish:  string;
};

const DEFAULT_STRINGS: PbnPublishStrings = {
  title:            "Publish PbN Results to Applicants",
  published_desc:   "Applicants can currently see their true accreditation status (approved / rejected).",
  unpublished_desc: "Results are currently hidden from applicants. They see \"Application Under Review\" until you publish.",
  saving:           "Saving…",
  unpublish:        "Unpublish Results",
  publish:          "Publish Results",
  before_publish:   "Before publishing: Ensure all NOC PbN allocations have been approved and ACR has been notified. This action is visible to all applicants immediately.",
};

export function PbnPublishToggle({
  isPublished,
  strings = DEFAULT_STRINGS,
}: {
  isPublished: boolean;
  strings?: PbnPublishStrings;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      if (isPublished) {
        await unpublishPbnResults();
      } else {
        await publishPbnResults();
      }
    });
  }

  return (
    <div className={`mt-5 rounded-xl border-2 p-5 ${isPublished ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPublished ? "bg-green-500" : "bg-gray-400"}`}>
              <span className="text-white text-xs font-bold">{isPublished ? "ON" : "OFF"}</span>
            </div>
            <h2 className="font-semibold text-gray-900">{strings.title}</h2>
          </div>
          <p className="text-xs text-gray-500 ml-10">
            {isPublished ? strings.published_desc : strings.unpublished_desc}
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
            isPublished
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {isPending
            ? strings.saving
            : isPublished
            ? strings.unpublish
            : strings.publish}
        </button>
      </div>

      {!isPublished && (
        <div className="mt-3 ml-10 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          {strings.before_publish}
        </div>
      )}
    </div>
  );
}
