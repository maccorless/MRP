/**
 * Shared quota calculation helpers used across PbN, application review,
 * and dashboard pages.
 */

import type { AccredCategory } from "@/lib/category";

export type CategoryTotals = Record<AccredCategory, number>;

/** Sum per-category slot allocations from an array of allocation rows. */
export function sumAllocations(allocs: {
  eSlots: number | null;
  esSlots: number | null;
  epSlots: number | null;
  epsSlots: number | null;
  etSlots: number | null;
  ecSlots: number | null;
}[]): CategoryTotals {
  return {
    E:   allocs.reduce((s, a) => s + (a.eSlots   ?? 0), 0),
    Es:  allocs.reduce((s, a) => s + (a.esSlots  ?? 0), 0),
    EP:  allocs.reduce((s, a) => s + (a.epSlots  ?? 0), 0),
    EPs: allocs.reduce((s, a) => s + (a.epsSlots ?? 0), 0),
    ET:  allocs.reduce((s, a) => s + (a.etSlots  ?? 0), 0),
    EC:  allocs.reduce((s, a) => s + (a.ecSlots  ?? 0), 0),
  };
}

/** Determine whether a category is over quota. */
export function isOverQuota(allocated: number, requested: number, total: number): boolean {
  return total > 0 && (allocated + requested) > total;
}

/** Derive the aggregate PbN status from a set of allocation pbnState values. */
export function derivePbnStatus(states: string[]): "not_started" | "draft" | "noc_submitted" | "ocog_approved" | "sent_to_acr" {
  if (states.length === 0) return "not_started";
  if (states.every((s) => s === "sent_to_acr")) return "sent_to_acr";
  if (states.every((s) => s === "ocog_approved" || s === "sent_to_acr")) return "ocog_approved";
  if (states.some((s) => s === "noc_submitted")) return "noc_submitted";
  return "draft";
}

/** Count items by a string key. */
export function countByStatus<T extends string>(items: { status: T }[]): Record<T, number> {
  const counts = {} as Record<T, number>;
  for (const item of items) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }
  return counts;
}
