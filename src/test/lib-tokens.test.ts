import { describe, it, expect } from "vitest";
import { generateToken, hashToken } from "@/lib/tokens";

describe("generateToken", () => {
  it("returns a string of the requested length", () => {
    expect(generateToken(8)).toHaveLength(8);
    expect(generateToken(4)).toHaveLength(4);
    expect(generateToken(16)).toHaveLength(16);
  });

  it("only uses the safe charset (no ambiguous chars)", () => {
    for (let i = 0; i < 50; i++) {
      const token = generateToken(12);
      expect(token).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
    }
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken(8)));
    expect(tokens.size).toBe(100);
  });

  it("has uniform distribution across CHARSET (rejection-sampled)", () => {
    const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const counts = new Map<string, number>();
    for (const c of CHARSET) counts.set(c, 0);

    // 31 chars × 2000 samples each = 62000 total characters
    const sampleSize = 62000;
    const tokens = Array.from({ length: sampleSize / 10 }, () => generateToken(10));
    for (const tok of tokens) {
      for (const c of tok) counts.set(c, (counts.get(c) ?? 0) + 1);
    }

    const expected = sampleSize / CHARSET.length; // 2000
    // Chi-square-ish tolerance: every bucket must be within ±8% of expected.
    // Biased generator gets the first 8 chars ~12.5% higher → fails this.
    for (const [char, count] of counts) {
      const deviation = Math.abs(count - expected) / expected;
      expect(deviation, `char ${char} count=${count} expected=${expected}`).toBeLessThan(0.08);
    }
  });
});

describe("hashToken", () => {
  it("returns a hex SHA-256 hash", () => {
    const hash = hashToken("K7M2ABCD");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is case-insensitive (uppercases before hashing)", () => {
    expect(hashToken("abc123")).toBe(hashToken("ABC123"));
    expect(hashToken("k7m2")).toBe(hashToken("K7M2"));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashToken("AAAA")).not.toBe(hashToken("BBBB"));
  });

  it("is deterministic", () => {
    const hash1 = hashToken("TEST1234");
    const hash2 = hashToken("TEST1234");
    expect(hash1).toBe(hash2);
  });
});
