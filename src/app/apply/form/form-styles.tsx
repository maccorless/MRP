import type { FormErrors } from "./EoiFormTabs";

export const BASE_INPUT =
  "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent";
export const INPUT = BASE_INPUT + " border-gray-300";
export const LABEL = "block text-sm font-medium text-gray-700 mb-1";
export const HELP = "text-xs text-gray-600 mt-1";

export function inp(name: string, errors?: FormErrors): string {
  return `${BASE_INPUT} ${errors?.[name] ? "border-red-500" : "border-gray-300"}`;
}

export function Err({ name, errors }: { name: string; errors?: FormErrors }) {
  if (!errors?.[name]) return null;
  return (
    <p id={`err-${name}`} className="text-xs text-red-500 mt-1" role="alert">
      {errors[name]}
    </p>
  );
}
