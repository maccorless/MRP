import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { requireBaseUrl } from "@/lib/env";

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
