import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "chargehub_session";

async function isSessionValid(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const secret = process.env.JWT_SECRET;
  if (!secret) return false;

  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    return Boolean(payload.sub);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Public API auth routes always pass
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isProtected =
    pathname.startsWith("/home") ||
    pathname.startsWith("/discover") ||
    pathname.startsWith("/station") ||
    pathname.startsWith("/session") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/profile");

  const authenticated = await isSessionValid(request);

  // If already logged in, redirect away from /login and /signup
  if (authenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // If not logged in and visiting protected route, redirect to /login with next param
  if (!authenticated && isProtected) {
    const nextPath = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/login?next=${nextPath}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
