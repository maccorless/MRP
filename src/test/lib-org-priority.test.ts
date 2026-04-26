/**
 * Unit tests: src/lib/labels.ts ORG_TYPE_PRIORITY map + getOrgTypePriority.
 * Pure functions, no DB.
 */

import { describe, it, expect } from "vitest";
import { ORG_TYPE_PRIORITY, getOrgTypePriority } from "@/lib/labels";

describe("getOrgTypePriority", () => {
  it("returns 10 for press_agency (Tier 1 — national news/sports agencies)", () => {
    expect(getOrgTypePriority("press_agency")).toBe(10);
  });

  it("returns 70 for non_mrh (Tier 6)", () => {
    expect(getOrgTypePriority("non_mrh")).toBe(70);
  });

  it("returns 99 for an unknown org type", () => {
    expect(getOrgTypePriority("unknown_value")).toBe(99);
  });

  it("returns 99 for null", () => {
    expect(getOrgTypePriority(null)).toBe(99);
  });

  it("returns 99 for undefined", () => {
    expect(getOrgTypePriority(undefined)).toBe(99);
  });

  it("returns 99 for empty string", () => {
    expect(getOrgTypePriority("")).toBe(99);
  });
});

describe("ORG_TYPE_PRIORITY map", () => {
  it("every entry is a positive integer", () => {
    const entries = Object.entries(ORG_TYPE_PRIORITY);
    expect(entries.length).toBeGreaterThan(0);
    for (const [type, priority] of entries) {
      expect(Number.isInteger(priority), `${type} must be an integer`).toBe(true);
      expect(priority, `${type} must be > 0`).toBeGreaterThan(0);
    }
  });

  it("press_agency and news_agency are tied at the top tier", () => {
    expect(ORG_TYPE_PRIORITY.press_agency).toBe(ORG_TYPE_PRIORITY.news_agency);
    expect(ORG_TYPE_PRIORITY.press_agency).toBeLessThan(ORG_TYPE_PRIORITY.print_media);
  });

  it("preserves the Strategic Plan §1.6 ordering: agencies < dailies < specialists < magazines", () => {
    expect(ORG_TYPE_PRIORITY.press_agency).toBeLessThan(ORG_TYPE_PRIORITY.print_media);
    expect(ORG_TYPE_PRIORITY.print_media).toBeLessThan(ORG_TYPE_PRIORITY.sport_specialist_website);
    expect(ORG_TYPE_PRIORITY.sport_specialist_website).toBeLessThan(ORG_TYPE_PRIORITY.editorial_website);
  });

  it("non_mrh and enr fall in the bottom tier (≥ 70)", () => {
    expect(ORG_TYPE_PRIORITY.non_mrh).toBeGreaterThanOrEqual(70);
    expect(ORG_TYPE_PRIORITY.enr).toBeGreaterThanOrEqual(70);
  });
});
