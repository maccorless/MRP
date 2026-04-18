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

/**
 * Returns the value to use for the cookie `Secure` attribute.
 * Defaults to true so staging and prod are always Secure, regardless of NODE_ENV.
 * Set ALLOW_INSECURE_COOKIES=true in a local .env.local to develop over http://.
 */
export function cookieSecureFlag(): boolean {
  return process.env.ALLOW_INSECURE_COOKIES !== "true";
}
