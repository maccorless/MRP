"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "press", label: "Press", desc: "Journalists, writers, reporters" },
  { value: "photo", label: "Photo", desc: "Still photographers" },
  { value: "both",  label: "Both — Press & Photo", desc: "Organisation covers both press and photography" },
] as const;

export function CategoryQuantityFields({
  defaultCategory,
  defaultRequestedPress,
  defaultRequestedPhoto,
}: {
  defaultCategory?: "press" | "photo" | "both";
  defaultRequestedPress?: number | null;
  defaultRequestedPhoto?: number | null;
}) {
  const [category, setCategory] = useState<string>(defaultCategory ?? "");

  const showPress = category === "press" || category === "both";
  const showPhoto = category === "photo" || category === "both";

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Select all that apply. Press = journalists, writers, reporters. Photo = still photographers.
        </p>
        <div className="space-y-2">
          {CATEGORIES.map(({ value, label, desc }) => (
            <label
              key={value}
              className="flex items-start gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 has-[:checked]:border-brand-blue has-[:checked]:bg-blue-50"
            >
              <input
                type="radio"
                name="category"
                value={value}
                required
                checked={category === value}
                onChange={() => setCategory(value)}
                className="mt-0.5 accent-brand-blue"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {(showPress || showPhoto) && (
        <div className="grid grid-cols-2 gap-4">
          {showPress && (
            <div>
              <label
                htmlFor="requested_press"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Press accreditations requested <span className="text-red-500">*</span>
              </label>
              <input
                id="requested_press"
                name="requested_press"
                type="number"
                required
                min={1}
                defaultValue={defaultRequestedPress ?? ""}
                placeholder="e.g. 3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">How many journalists/reporters?</p>
            </div>
          )}
          {showPhoto && (
            <div>
              <label
                htmlFor="requested_photo"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Photo accreditations requested <span className="text-red-500">*</span>
              </label>
              <input
                id="requested_photo"
                name="requested_photo"
                type="number"
                required
                min={1}
                defaultValue={defaultRequestedPhoto ?? ""}
                placeholder="e.g. 2"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">How many photographers?</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
