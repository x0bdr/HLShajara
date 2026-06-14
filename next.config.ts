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
  async redirects() {
    const locales = ["ar", "en"];
    const unlistedPaths = ["/record", "/mission", "/faq", "/reply", "/policy", "/dashboard", "/publications"];
    const redirects: { source: string; destination: string; permanent: boolean }[] = [];

    for (const locale of locales) {
      for (const path of unlistedPaths) {
        redirects.push({
          source: `/${locale}${path}`,
          destination: `/${locale}`,
          permanent: false,
        });
        // Also redirect sub-paths for record, publications, and entity detail.
        if (path === "/record" || path === "/publications") {
          redirects.push({
            source: `/${locale}${path}/:path*`,
            destination: `/${locale}`,
            permanent: false,
          });
        }
      }
      // Entity detail pages are not listed in the nav either.
      redirects.push({
        source: `/${locale}/entity/:id`,
        destination: `/${locale}`,
        permanent: false,
      });
    }

    return redirects;
  },
};

export default withNextIntl(nextConfig);
