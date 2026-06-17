import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward every /en/* request to /ar/* until English is launched.
  if (pathname.startsWith("/en")) {
    const target = new URL(pathname.replace(/^\/en/, "/ar"), request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target);
  }

  const response = intlMiddleware(request);
  response.headers.set("x-proxy", "active");
  return response;
}

export const config = {
  // Skip Next.js internals, API routes, and public static assets
  // (fonts, logos, favicons, slider images in /pics, uploads).
  matcher: [
    "/((?!api|_next|fonts|pics|uploads|logo|favicon|robots\\.txt|sitemap\\.xml|.*\\.(?:ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|otf)).*)",
  ],
};
