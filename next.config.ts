import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isStaticExport = process.env.EXPORT_STATIC === "1";

const HIDDEN_PATHS = [
  "record",
  "mission",
  "faq",
  "reply",
  "policy",
  "dashboard",
  "publications",
  "entity",
];

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined,
  basePath: isStaticExport ? "/HLShajara" : "",
  images: {
    unoptimized: true,
  },
  async redirects() {
    return HIDDEN_PATHS.flatMap((path) => [
      { source: `/ar/${path}/:path*`, destination: "/ar", permanent: false },
      { source: `/en/${path}/:path*`, destination: "/en", permanent: false },
    ]);
  },
};

export default withNextIntl(nextConfig);
