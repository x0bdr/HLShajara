import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/record",
  "/entity",
  "/reply",
  "/mission",
  "/faq",
  "/terms",
  "/privacy",
  "/api/submit",
  "/api/auth",
];

const REVIEWER_PATHS = ["/reviewer", "/api/review"];

function isPublic(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path.startsWith(p));
}

function isReviewer(path: string): boolean {
  return REVIEWER_PATHS.some((p) => path.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths are always allowed
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Reviewer paths need auth (checked at API/page level, not here)
  if (isReviewer(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|logo).*)"],
};
