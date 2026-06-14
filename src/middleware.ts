import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});

// Pages that are not listed in the main nav are temporarily redirected home.
const REDIRECTED_PATHS = new Set([
  "record",
  "mission",
  "faq",
  "reply",
  "policy",
  "dashboard",
  "publications",
  "entity",
]);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0];
  const page = segments[1];

  if (["ar", "en"].includes(locale) && page && REDIRECTED_PATHS.has(page)) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  const response = intlMiddleware(request);
  response.headers.set("x-middleware", "active");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|fonts|logo|favicon).*)"],
};
