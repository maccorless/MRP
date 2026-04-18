/**
 * Fail-secure lookup for NEXTAUTH_URL.
 * Mirrors the NEXTAUTH_SECRET pattern in src/lib/session.ts — only local
 * development may fall back to a default; every other environment must
 * set the variable explicitly.
 */
export function requireBaseUrl(): string {
  const raw = process.env.NEXTAUTH_URL;
  if (raw) return raw.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  throw new Error("NEXTAUTH_URL is not set");
}
