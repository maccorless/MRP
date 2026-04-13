/**
 * Cookie-based session for admin users.
 * Uses Web Crypto HMAC-SHA256 (works in both Node.js and edge runtime).
 * Replaced by D.TEC/DGP SSO at v1.0.
 */

import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AdminRole =
  | "ioc_admin"
  | "ioc_readonly"
  | "noc_admin"
  | "ocog_admin"
  | "if_admin";

export type SessionPayload = {
  userId: string;
  email: string;
  role: AdminRole;
  nocCode: string | null;  // set for noc_admin
  ifCode: string | null;   // set for if_admin
  displayName: string;
  canaryFlags?: string[];  // feature flags this user is enrolled in for canary testing
  // Sudo fields — present only when an IOC admin is acting as another user
  isSudo?: boolean;
  sudoActorLabel?: string; // display name of the IOC admin who initiated the sudo
};

const COOKIE_NAME = "mrp_session";
const SUDO_COOKIE_NAME = "mrp_sudo_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
const SUDO_MAX_AGE = 60 * 60; // 1 hour

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
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
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

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function setSudoSession(payload: SessionPayload): Promise<void> {
  const value = await encodeSession(payload);
  const jar = await cookies();
  jar.set(SUDO_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SUDO_MAX_AGE,
    path: "/",
  });
}

export async function clearSudoSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SUDO_COOKIE_NAME);
}

/**
 * Returns the active session, preferring the sudo session when present.
 * This means a window where sudo was activated will use the target user's
 * identity automatically.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const sudoCookie = jar.get(SUDO_COOKIE_NAME);
  if (sudoCookie) {
    const sudoPayload = await decodeSession(sudoCookie.value);
    if (sudoPayload) return sudoPayload;
  }
  const cookie = jar.get(COOKIE_NAME);
  if (!cookie) return null;
  return decodeSession(cookie.value);
}

/**
 * Returns the IOC admin's own session, bypassing any active sudo session.
 * Use this to verify the initiating admin's identity when generating a sudo token.
 */
export async function getBaseSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const cookie = jar.get(COOKIE_NAME);
  if (!cookie) return null;
  return decodeSession(cookie.value);
}

/**
 * Throws a redirect if the current session is a sudo session.
 * Call at the top of any Server Action that writes data.
 */
export async function requireWritable(): Promise<void> {
  const session = await getSession();
  if (session?.isSudo) {
    redirect("/admin?error=sudo_readonly");
  }
}

/** Use in server components/layouts that require auth. Redirects if not authenticated. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** Use in NOC-only pages. */
export async function requireNocSession(): Promise<SessionPayload & { nocCode: string }> {
  const session = await requireSession();
  console.log("[AUTH] requireNocSession check", {
    role: session.role,
    nocCode: session.nocCode,
    email: session.email,
    pass: session.role === "noc_admin" && !!session.nocCode,
  });
  if (session.role !== "noc_admin" || !session.nocCode) redirect("/admin/login");
  return session as SessionPayload & { nocCode: string };
}

/** Use in IF-only pages. */
export async function requireIfSession(): Promise<SessionPayload & { ifCode: string }> {
  const session = await requireSession();
  if (session.role !== "if_admin" || !session.ifCode) redirect("/admin/login");
  return session as SessionPayload & { ifCode: string };
}

/** Use in pages accessible to both NOC admins and IF admins. */
export async function requireNocOrIfSession(): Promise<SessionPayload & { bodyCode: string }> {
  const session = await requireSession();
  if (session.role === "noc_admin" && session.nocCode) {
    return { ...session, bodyCode: session.nocCode };
  }
  if (session.role === "if_admin" && session.ifCode) {
    return { ...session, bodyCode: session.ifCode };
  }
  redirect("/admin/login");
}

/** Use in OCOG-only pages. */
export async function requireOcogSession(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "ocog_admin") redirect("/admin/login");
  return session;
}

/** Use in IOC-only pages. */
export async function requireIocSession(): Promise<SessionPayload> {
  const session = await requireSession();
  if (!session.role.startsWith("ioc_")) redirect("/admin/login");
  return session;
}

/** Use in pages the IOC admin (not readonly) can access. */
export async function requireIocAdminSession(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "ioc_admin") redirect("/admin/login");
  return session;
}
