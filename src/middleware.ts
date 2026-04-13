import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";

const COOKIE_NAME = "mrp_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin routes (not /admin/login itself)
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie) {
    console.log("[MW] no session cookie, redirecting to login", { pathname });
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const session = await decodeSession(cookie.value);
  if (!session) {
    console.log("[MW] session decode failed, redirecting to login", { pathname, cookieLength: cookie.value.length });
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  console.log("[MW] session valid, proceeding", { pathname, email: session.email, role: session.role });
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
