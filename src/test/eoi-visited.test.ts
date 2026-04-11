import { describe, it, expect } from "vitest";
import { serializeVisited, deserializeVisited } from "@/app/apply/form/EoiFormTabs";

describe("serializeVisited", () => {
  it("serialises an empty set to an empty JSON array", () => {
    expect(serializeVisited(new Set())).toBe("[]");
  });

  it("serialises a populated set to a sorted JSON array", () => {
    expect(serializeVisited(new Set([2, 0, 4]))).toBe("[0,2,4]");
  });
});

describe("deserializeVisited", () => {
  it("returns an empty set for null", () => {
    expect(deserializeVisited(null).size).toBe(0);
  });

  it("returns an empty set for invalid JSON", () => {
    expect(deserializeVisited("not-json").size).toBe(0);
  });

  it("reconstructs a set from a valid JSON array", () => {
    const result = deserializeVisited("[0,2,4]");
    expect(result.has(0)).toBe(true);
    expect(result.has(2)).toBe(true);
    expect(result.has(4)).toBe(true);
    expect(result.size).toBe(3);
  });

  it("ignores non-number entries", () => {
    const result = deserializeVisited('["a", 1, null, 3]');
    expect(result.has(1)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.size).toBe(2);
  });

  it("round-trips a set through serialize and deserialize", () => {
    const original = new Set([0, 2, 4]);
    const result = deserializeVisited(serializeVisited(original));
    expect(result.size).toBe(3);
    expect(result.has(0)).toBe(true);
    expect(result.has(2)).toBe(true);
    expect(result.has(4)).toBe(true);
  });
});
