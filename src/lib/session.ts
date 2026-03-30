/**
 * Cookie-based session for admin users.
 * Uses Web Crypto HMAC-SHA256 (works in both Node.js and edge runtime).
 * Replaced by D.TEC/DGP SSO at v1.0.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type SessionPayload = {
  userId: string;
  email: string;
  role: string; // "ioc_admin" | "noc_admin" | "ioc_readonly"
  nocCode: string | null;
  displayName: string;
};

const COOKIE_NAME = "mrp_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return secret;
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return Buffer.from(sig).toString("base64url");
}

async function verify(data: string, signature: string, secret: string): Promise<boolean> {
  const expected = await sign(data, secret);
  return expected === signature;
}

export async function encodeSession(payload: SessionPayload): Promise<string> {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = await sign(data, getSecret());
  return `${data}.${sig}`;
}

export async function decodeSession(value: string): Promise<SessionPayload | null> {
  try {
    const [data, sig] = value.split(".");
    if (!data || !sig) return null;
    const ok = await verify(data, sig, getSecret());
    if (!ok) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSession(payload: SessionPayload): Promise<void> {
  const value = await encodeSession(payload);
  const jar = await cookies();
  jar.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const cookie = jar.get(COOKIE_NAME);
  if (!cookie) return null;
  return decodeSession(cookie.value);
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Use in server components/layouts that require auth. Redirects if not authenticated. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** Use in NOC-only pages. Redirects if not a NOC admin. */
export async function requireNocSession(): Promise<SessionPayload & { nocCode: string }> {
  const session = await requireSession();
  if (session.role !== "noc_admin" || !session.nocCode) redirect("/admin/login");
  return session as SessionPayload & { nocCode: string };
}

/** Use in IOC-only pages. */
export async function requireIocSession(): Promise<SessionPayload> {
  const session = await requireSession();
  if (!session.role.startsWith("ioc_")) redirect("/admin/login");
  return session;
}
