/**
 * Unit tests: src/lib/eligibility.ts — .gov domain detection + flag aggregation.
 * Pure functions, no DB, no mocking required.
 */

import { describe, it, expect } from "vitest";
import { isGovernmentEmail, ineligibilityFlags } from "@/lib/eligibility";

describe("isGovernmentEmail", () => {
  it("matches a bare .gov TLD", () => {
    expect(isGovernmentEmail("foo@example.gov")).toBe(true);
  });

  it("matches .gov.<cc> with a country code (UK)", () => {
    expect(isGovernmentEmail("foo@dept.gov.uk")).toBe(true);
  });

  it("matches .gov.<cc> with a country code (AU)", () => {
    expect(isGovernmentEmail("foo@dept.gov.au")).toBe(true);
  });

  it("does not match a plain .com domain", () => {
    expect(isGovernmentEmail("foo@example.com")).toBe(false);
  });

  it("does not match when 'gov' is part of a non-TLD label", () => {
    expect(isGovernmentEmail("foo@gov-example.com")).toBe(false);
  });

  it("does not match the literal word 'government' in a non-.gov domain", () => {
    expect(isGovernmentEmail("foo@government.com")).toBe(false);
  });

  it("returns false for empty string, null, undefined", () => {
    expect(isGovernmentEmail("")).toBe(false);
    expect(isGovernmentEmail(null)).toBe(false);
    expect(isGovernmentEmail(undefined)).toBe(false);
  });

  it("returns false when the @ is missing", () => {
    expect(isGovernmentEmail("foo.example.gov")).toBe(false);
  });

  it("returns false when the address ends at the @", () => {
    expect(isGovernmentEmail("foo@")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isGovernmentEmail("foo@DEPT.GOV.UK")).toBe(true);
    expect(isGovernmentEmail("foo@Example.Gov")).toBe(true);
  });
});

describe("ineligibilityFlags", () => {
  it("returns a single gov_domain flag when contactEmail is on .gov", () => {
    const flags = ineligibilityFlags({ contactEmail: "foo@dept.gov" });
    expect(flags).toHaveLength(1);
    expect(flags[0].code).toBe("gov_domain");
    expect(flags[0].label.length).toBeGreaterThan(0);
  });

  it("flags when orgEmail is .gov even if contactEmail is not", () => {
    const flags = ineligibilityFlags({
      contactEmail: "foo@example.com",
      orgEmail: "info@dept.gov",
    });
    expect(flags).toHaveLength(1);
    expect(flags[0].code).toBe("gov_domain");
  });

  it("flags when secondaryContactEmail is .gov", () => {
    const flags = ineligibilityFlags({
      contactEmail: "foo@example.com",
      orgEmail: "info@example.com",
      secondaryContactEmail: "press@cabinet.gov.au",
    });
    expect(flags).toHaveLength(1);
    expect(flags[0].code).toBe("gov_domain");
  });

  it("returns an empty array when no email fields are provided", () => {
    expect(ineligibilityFlags({})).toEqual([]);
  });

  it("returns an empty array when all emails are non-.gov", () => {
    const flags = ineligibilityFlags({
      contactEmail: "foo@example.com",
      orgEmail: "info@example.com",
      secondaryContactEmail: "press@news.org",
    });
    expect(flags).toEqual([]);
  });

  it("does not double-flag when multiple .gov emails are present", () => {
    const flags = ineligibilityFlags({
      contactEmail: "a@dept.gov",
      orgEmail: "b@dept.gov.uk",
    });
    expect(flags).toHaveLength(1);
  });
});
