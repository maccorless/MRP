import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";

const COOKIE_NAME = "prp_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin routes (not /admin/login itself)
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const session = await decodeSession(cookie.value);
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const runtime = "nodejs";

export const config = {
  matcher: ["/admin/:path*"],
};
