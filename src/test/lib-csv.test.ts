import { describe, it, expect } from "vitest";
import { csvEscape, buildCsv } from "@/lib/csv";

describe("csvEscape", () => {
  it("wraps values in double quotes", () => {
    expect(csvEscape("hello")).toBe('"hello"');
  });

  it("doubles internal quotes", () => {
    expect(csvEscape('say "hello"')).toBe('"say ""hello"""');
  });

  it("handles null and undefined", () => {
    expect(csvEscape(null)).toBe('""');
    expect(csvEscape(undefined)).toBe('""');
  });

  it("handles numbers", () => {
    expect(csvEscape(42)).toBe('"42"');
    expect(csvEscape(0)).toBe('"0"');
  });

  it("neutralizes CSV injection payloads", () => {
    // Formula injection: values starting with =, +, -, @ should be wrapped
    expect(csvEscape("=CMD()")).toBe('"=CMD()"');
    expect(csvEscape("+1+1")).toBe('"+1+1"');
    expect(csvEscape("-1-1")).toBe('"-1-1"');
    expect(csvEscape("@SUM(A1)")).toBe('"@SUM(A1)"');
  });

  it("handles values with commas and newlines", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("buildCsv", () => {
  it("builds a header + data CSV string", () => {
    const csv = buildCsv(["Name", "Age"], [["Alice", 30], ["Bob", 25]]);
    expect(csv).toBe('"Name","Age"\n"Alice","30"\n"Bob","25"');
  });

  it("handles empty rows", () => {
    const csv = buildCsv(["Name"], []);
    expect(csv).toBe('"Name"');
  });

  it("handles null values in rows", () => {
    const csv = buildCsv(["A", "B"], [["x", null]]);
    expect(csv).toBe('"A","B"\n"x",""');
  });
});
