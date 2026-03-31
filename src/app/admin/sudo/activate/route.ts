import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sudoTokens, adminUsers } from "@/db/schema";
import { setSudoSession } from "@/lib/session";
import type { SessionPayload, AdminRole } from "@/lib/session";

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );
  return Buffer.from(digest).toString("hex");
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/admin/sudo/activate?error=missing_token", req.url));
  }

  const tokenHash = await hashToken(token);

  const [row] = await db
    .select()
    .from(sudoTokens)
    .where(eq(sudoTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row) {
    return NextResponse.redirect(new URL("/admin?error=sudo_invalid", req.url));
  }

  if (row.usedAt) {
    return NextResponse.redirect(new URL("/admin?error=sudo_already_used", req.url));
  }

  if (row.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/admin?error=sudo_expired", req.url));
  }

  // Mark token as consumed
  await db
    .update(sudoTokens)
    .set({ usedAt: new Date() })
    .where(eq(sudoTokens.id, row.id));

  // Look up the target user
  const [target] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, row.targetEmail))
    .limit(1);

  if (!target) {
    return NextResponse.redirect(new URL("/admin?error=sudo_user_not_found", req.url));
  }

  const sudoPayload: SessionPayload = {
    userId: target.id,
    email: target.email,
    role: target.role as AdminRole,
    nocCode: target.nocCode ?? null,
    ifCode: target.ifCode ?? null,
    displayName: target.displayName,
    isSudo: true,
    sudoActorLabel: row.actorLabel,
  };

  const response = NextResponse.redirect(new URL("/admin", req.url));

  // Set the sudo cookie on the redirect response
  const encoded = await encodeSudoSession(sudoPayload);
  response.cookies.set("mrp_sudo_session", encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });

  return response;
}

// Inline encode to avoid importing from session.ts which uses `cookies()` (not available in route handlers)
async function encodeSudoSession(payload: SessionPayload): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${Buffer.from(sig).toString("base64url")}`;
}
