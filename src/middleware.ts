import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";

const COOKIE_NAME = "prp_session";
const SUDO_COOKIE_NAME = "prp_sudo_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // nonce is generated per-request so the x-nonce header is available to the
  // root layout when nonce propagation to <Script> tags is wired up.
  // 'unsafe-inline' is retained on script-src until that wiring is complete;
  // in browsers that support nonces, the nonce takes precedence and
  // 'unsafe-inline' is ignored.
  const nonce = btoa(crypto.randomUUID());
  const cspValue = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    "style-src 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  // Auth guard — only admin routes (not login itself)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    // Accept either a valid sudo session or a valid base session
    const sudoCookie = req.cookies.get(SUDO_COOKIE_NAME);
    if (sudoCookie) {
      const sudoSession = await decodeSession(sudoCookie.value);
      if (sudoSession) {
        // Valid sudo session — skip base session check
      } else {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    } else {
      const cookie = req.cookies.get(COOKIE_NAME);
      if (!cookie) return NextResponse.redirect(new URL("/admin/login", req.url));
      const session = await decodeSession(cookie.value);
      if (!session) return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Propagate nonce to App Router RSC renderer (x-nonce) and browser (CSP header)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspValue);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", cspValue);
  return response;
}

export const runtime = "nodejs";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
