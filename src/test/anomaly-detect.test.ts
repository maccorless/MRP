import { describe, it, expect } from "vitest";
import {
  detectConcentrationRisk,
  detectInactiveNocs,
  detectCrossNocDuplicates,
} from "@/lib/anomaly-detect";

// ─── detectConcentrationRisk ──────────────────────────────────────────────────

describe("detectConcentrationRisk", () => {
  const baseRow = {
    nocCode: "USA",
    organizationId: "org-1",
    orgName: "Reuters",
    requestedE: 0,
    requestedEs: 0,
    requestedEp: 0,
    requestedEps: 0,
    requestedEt: 0,
    requestedEc: 0,
  };

  it("flags an org requesting more than 30% of its NOC quota", () => {
    const rows = [{ ...baseRow, requestedE: 40 }]; // 40 / 100 = 40%
    const quotaMap = { USA: 100 };
    const flags = detectConcentrationRisk(rows, quotaMap);
    expect(flags).toHaveLength(1);
    expect(flags[0].nocCode).toBe("USA");
    expect(flags[0].orgName).toBe("Reuters");
    expect(flags[0].pct).toBeCloseTo(0.4);
  });

  it("does not flag an org at exactly 30%", () => {
    const rows = [{ ...baseRow, requestedE: 30 }]; // 30 / 100 = 30%, not > 30%
    const quotaMap = { USA: 100 };
    const flags = detectConcentrationRisk(rows, quotaMap);
    expect(flags).toHaveLength(0);
  });

  it("does not flag an org below 30%", () => {
    const rows = [{ ...baseRow, requestedE: 20 }];
    const quotaMap = { USA: 100 };
    const flags = detectConcentrationRisk(rows, quotaMap);
    expect(flags).toHaveLength(0);
  });

  it("handles zero quota — never flags (avoids divide-by-zero)", () => {
    const rows = [{ ...baseRow, requestedE: 50 }];
    const quotaMap = { USA: 0 };
    const flags = detectConcentrationRisk(rows, quotaMap);
    expect(flags).toHaveLength(0);
  });

  it("handles missing noc_code in quotaMap — treated as zero quota", () => {
    const rows = [{ ...baseRow, requestedE: 50 }];
    const flags = detectConcentrationRisk(rows, {});
    expect(flags).toHaveLength(0);
  });

  it("sums all requested category slots across multiple rows for the same org", () => {
    // Two rows for the same org (e.g. two applications)
    const rows = [
      { ...baseRow, requestedE: 20 },
      { ...baseRow, requestedEp: 15 }, // combined = 35 / 100 = 35%
    ];
    const quotaMap = { USA: 100 };
    const flags = detectConcentrationRisk(rows, quotaMap);
    expect(flags).toHaveLength(1);
    expect(flags[0].slots).toBe(35);
  });

  it("uses custom threshold", () => {
    const rows = [{ ...baseRow, requestedE: 20 }]; // 20%
    const quotaMap = { USA: 100 };
    // Should flag at 15% threshold
    expect(detectConcentrationRisk(rows, quotaMap, 0.15)).toHaveLength(1);
    // Should not flag at 25% threshold
    expect(detectConcentrationRisk(rows, quotaMap, 0.25)).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    expect(detectConcentrationRisk([], {}, 0.30)).toHaveLength(0);
  });
});

// ─── detectInactiveNocs ───────────────────────────────────────────────────────

describe("detectInactiveNocs", () => {
  const now = Date.now();
  const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);

  it("flags a NOC whose window opened 10 days ago with no approvals", () => {
    const rows = [{ nocCode: "FRA", status: "pending", reviewedAt: null }];
    const windows = new Map([["FRA", daysAgo(10)]]);
    const inactive = detectInactiveNocs(rows, windows);
    expect(inactive).toHaveLength(1);
    expect(inactive[0].nocCode).toBe("FRA");
    expect(inactive[0].lastApprovalAt).toBeNull();
    expect(inactive[0].daysSince).toBeGreaterThanOrEqual(10);
  });

  it("flags a NOC whose last approval was 8 days ago", () => {
    const rows = [{ nocCode: "GBR", status: "approved", reviewedAt: daysAgo(8) }];
    const windows = new Map([["GBR", daysAgo(20)]]);
    const inactive = detectInactiveNocs(rows, windows);
    expect(inactive).toHaveLength(1);
    expect(inactive[0].nocCode).toBe("GBR");
    expect(inactive[0].lastApprovalAt).toEqual(daysAgo(8));
  });

  it("does not flag a NOC whose last approval was 5 days ago", () => {
    const rows = [{ nocCode: "GER", status: "approved", reviewedAt: daysAgo(5) }];
    const windows = new Map([["GER", daysAgo(20)]]);
    const inactive = detectInactiveNocs(rows, windows);
    expect(inactive).toHaveLength(0);
  });

  it("does not flag a NOC whose window only opened 3 days ago (not yet stale)", () => {
    const rows = [{ nocCode: "JPN", status: "pending", reviewedAt: null }];
    const windows = new Map([["JPN", daysAgo(3)]]);
    const inactive = detectInactiveNocs(rows, windows);
    expect(inactive).toHaveLength(0);
  });

  it("returns empty array when no active windows", () => {
    const rows = [{ nocCode: "USA", status: "pending", reviewedAt: null }];
    const inactive = detectInactiveNocs(rows, new Map());
    expect(inactive).toHaveLength(0);
  });

  it("returns empty array for empty app rows with old windows", () => {
    const windows = new Map([["AUS", daysAgo(15)]]);
    const inactive = detectInactiveNocs([], windows);
    expect(inactive).toHaveLength(1);
    expect(inactive[0].nocCode).toBe("AUS");
    expect(inactive[0].lastApprovalAt).toBeNull();
  });

  it("ignores NOCs not in the active windows map", () => {
    const rows = [{ nocCode: "ITA", status: "pending", reviewedAt: null }];
    // ITA has no active window — not an anomaly
    const windows = new Map([["ESP", daysAgo(10)]]);
    const inactive = detectInactiveNocs(rows, windows);
    // ESP has no rows — it's inactive
    expect(inactive.some((n) => n.nocCode === "ITA")).toBe(false);
  });

  it("uses custom thresholdDays", () => {
    const rows = [{ nocCode: "KOR", status: "approved", reviewedAt: daysAgo(4) }];
    const windows = new Map([["KOR", daysAgo(20)]]);
    // With 3-day threshold: 4 days ago is stale
    expect(detectInactiveNocs(rows, windows, 3)).toHaveLength(1);
    // With 5-day threshold: 4 days ago is fine
    expect(detectInactiveNocs(rows, windows, 5)).toHaveLength(0);
  });
});

// ─── detectCrossNocDuplicates ─────────────────────────────────────────────────

describe("detectCrossNocDuplicates", () => {
  it("returns org names when isMultiTerritoryFlag is true", () => {
    const rows = [
      { orgName: "Reuters", isMultiTerritoryFlag: true },
      { orgName: "AP", isMultiTerritoryFlag: false },
      { orgName: "Reuters", isMultiTerritoryFlag: true }, // duplicate — should deduplicate
    ];
    const names = detectCrossNocDuplicates(rows);
    expect(names).toHaveLength(1);
    expect(names).toContain("Reuters");
  });

  it("returns empty array when no flagged orgs", () => {
    const rows = [
      { orgName: "Reuters", isMultiTerritoryFlag: false },
      { orgName: "AP", isMultiTerritoryFlag: null },
    ];
    expect(detectCrossNocDuplicates(rows)).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    expect(detectCrossNocDuplicates([])).toHaveLength(0);
  });

  it("handles multiple distinct flagged orgs", () => {
    const rows = [
      { orgName: "Reuters", isMultiTerritoryFlag: true },
      { orgName: "AFP", isMultiTerritoryFlag: true },
    ];
    const names = detectCrossNocDuplicates(rows);
    expect(names).toHaveLength(2);
    expect(names).toContain("Reuters");
    expect(names).toContain("AFP");
  });
});
