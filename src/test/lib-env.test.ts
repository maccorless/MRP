import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { requireBaseUrl, cookieSecureFlag } from "@/lib/env";

describe("requireBaseUrl", () => {
  const originalUrl = process.env.NEXTAUTH_URL;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete process.env.NEXTAUTH_URL;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = originalUrl;
    process.env.NODE_ENV = originalEnv;
  });

  it("returns NEXTAUTH_URL when set", () => {
    process.env.NEXTAUTH_URL = "https://portal.example.com";
    expect(requireBaseUrl()).toBe("https://portal.example.com");
  });

  it("returns localhost default in development", () => {
    process.env.NODE_ENV = "development";
    expect(requireBaseUrl()).toBe("http://localhost:3000");
  });

  it("throws in production when NEXTAUTH_URL missing", () => {
    process.env.NODE_ENV = "production";
    expect(() => requireBaseUrl()).toThrow(/NEXTAUTH_URL/);
  });

  it("throws in test when NEXTAUTH_URL missing and not explicitly development", () => {
    process.env.NODE_ENV = "test";
    expect(() => requireBaseUrl()).toThrow(/NEXTAUTH_URL/);
  });

  it("strips a trailing slash", () => {
    process.env.NEXTAUTH_URL = "https://portal.example.com/";
    expect(requireBaseUrl()).toBe("https://portal.example.com");
  });
});

describe("cookieSecureFlag", () => {
  const original = process.env.ALLOW_INSECURE_COOKIES;

  afterEach(() => {
    if (original === undefined) delete process.env.ALLOW_INSECURE_COOKIES;
    else process.env.ALLOW_INSECURE_COOKIES = original;
  });

  it("defaults to true", () => {
    delete process.env.ALLOW_INSECURE_COOKIES;
    expect(cookieSecureFlag()).toBe(true);
  });

  it("is false only when ALLOW_INSECURE_COOKIES is exactly 'true'", () => {
    process.env.ALLOW_INSECURE_COOKIES = "true";
    expect(cookieSecureFlag()).toBe(false);
  });

  it("is true for any other value of ALLOW_INSECURE_COOKIES", () => {
    for (const v of ["", "false", "0", "yes", "TRUE", " true ", "1"]) {
      process.env.ALLOW_INSECURE_COOKIES = v;
      expect(cookieSecureFlag(), `value=${JSON.stringify(v)}`).toBe(true);
    }
  });
});
