import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);
  response.headers.set("x-proxy", "active");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|fonts|logo|favicon).*)"],
};
