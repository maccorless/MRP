import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { requireBaseUrl, cookieSecureFlag } from "@/lib/env";

describe("requireBaseUrl", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_URL", "");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns NEXTAUTH_URL when set", () => {
    vi.stubEnv("NEXTAUTH_URL", "https://portal.example.com");
    expect(requireBaseUrl()).toBe("https://portal.example.com");
  });

  it("returns localhost default in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(requireBaseUrl()).toBe("http://localhost:3000");
  });

  it("throws in production when NEXTAUTH_URL missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => requireBaseUrl()).toThrow(/NEXTAUTH_URL/);
  });

  it("throws in test when NEXTAUTH_URL missing and not explicitly development", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(() => requireBaseUrl()).toThrow(/NEXTAUTH_URL/);
  });

  it("strips a trailing slash", () => {
    vi.stubEnv("NEXTAUTH_URL", "https://portal.example.com/");
    expect(requireBaseUrl()).toBe("https://portal.example.com");
  });
});

describe("cookieSecureFlag", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to true", () => {
    vi.stubEnv("ALLOW_INSECURE_COOKIES", "");
    expect(cookieSecureFlag()).toBe(true);
  });

  it("is false only when ALLOW_INSECURE_COOKIES is exactly 'true'", () => {
    vi.stubEnv("ALLOW_INSECURE_COOKIES", "true");
    expect(cookieSecureFlag()).toBe(false);
  });

  it("is true for any other value of ALLOW_INSECURE_COOKIES", () => {
    for (const v of ["", "false", "0", "yes", "TRUE", " true ", "1"]) {
      vi.stubEnv("ALLOW_INSECURE_COOKIES", v);
      expect(cookieSecureFlag(), `value=${JSON.stringify(v)}`).toBe(true);
    }
  });
});
