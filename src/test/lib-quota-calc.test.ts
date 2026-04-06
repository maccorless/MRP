import { describe, it, expect } from "vitest";
import { sumAllocations, isOverQuota, derivePbnStatus, countByStatus } from "@/lib/quota-calc";

describe("sumAllocations", () => {
  it("sums per-category slots across allocations", () => {
    const allocs = [
      { eSlots: 3, esSlots: 1, epSlots: 2, epsSlots: 0, etSlots: 0, ecSlots: 0 },
      { eSlots: 5, esSlots: 0, epSlots: 1, epsSlots: 1, etSlots: 2, ecSlots: 1 },
    ];
    const totals = sumAllocations(allocs);
    expect(totals.E).toBe(8);
    expect(totals.Es).toBe(1);
    expect(totals.EP).toBe(3);
    expect(totals.EPs).toBe(1);
    expect(totals.ET).toBe(2);
    expect(totals.EC).toBe(1);
  });

  it("handles null slot values", () => {
    const allocs = [
      { eSlots: null, esSlots: null, epSlots: null, epsSlots: null, etSlots: null, ecSlots: null },
    ];
    const totals = sumAllocations(allocs);
    expect(totals.E).toBe(0);
  });

  it("handles empty array", () => {
    const totals = sumAllocations([]);
    expect(totals.E).toBe(0);
  });
});

describe("isOverQuota", () => {
  it("returns true when allocation + request exceeds total", () => {
    expect(isOverQuota(8, 3, 10)).toBe(true);
  });

  it("returns false when within quota", () => {
    expect(isOverQuota(5, 3, 10)).toBe(false);
  });

  it("returns false when total is 0 (unlimited)", () => {
    expect(isOverQuota(100, 50, 0)).toBe(false);
  });
});

describe("derivePbnStatus", () => {
  it("returns not_started for empty array", () => {
    expect(derivePbnStatus([])).toBe("not_started");
  });

  it("returns sent_to_acr when all are sent", () => {
    expect(derivePbnStatus(["sent_to_acr", "sent_to_acr"])).toBe("sent_to_acr");
  });

  it("returns ocog_approved when all are approved or sent", () => {
    expect(derivePbnStatus(["ocog_approved", "sent_to_acr"])).toBe("ocog_approved");
  });

  it("returns noc_submitted when any are submitted", () => {
    expect(derivePbnStatus(["draft", "noc_submitted"])).toBe("noc_submitted");
  });

  it("returns draft for all-draft", () => {
    expect(derivePbnStatus(["draft", "draft"])).toBe("draft");
  });
});

describe("countByStatus", () => {
  it("counts items by their status field", () => {
    const items = [
      { status: "pending" as const },
      { status: "approved" as const },
      { status: "pending" as const },
      { status: "rejected" as const },
    ];
    const counts = countByStatus(items);
    expect(counts.pending).toBe(2);
    expect(counts.approved).toBe(1);
    expect(counts.rejected).toBe(1);
  });
});
