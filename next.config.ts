import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isStaticExport = process.env.EXPORT_STATIC === "1";

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined,
  basePath: isStaticExport ? "/HLShajara" : "",
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
