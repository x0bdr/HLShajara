import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isStaticExport = process.env.EXPORT_STATIC === "1";
const basePath = isStaticExport ? "/HLShajara" : "";

// Expose basePath to server components so image/asset URLs can be prefixed correctly.
process.env.NEXT_PUBLIC_BASE_PATH = basePath;

const HIDDEN_PATHS = ["dashboard"];

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined,
  basePath,
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
