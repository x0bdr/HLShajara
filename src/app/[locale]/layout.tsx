import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { fontVars } from "../fonts";
import { GtmScript, GtmNoScript } from "@/components/GtmScript";
import { GaScript } from "@/components/GaScript";
import { SITE_URL, brandName } from "@/lib/seo";
import { jsonLdSafe } from "@/lib/escape";
import "@/styles/tokens.css";
import "@/styles/globals.css";
import "@/components/hlshajara.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("metadata");
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      title,
      description,
      url: `/${locale}`,
      siteName: title,
      images: [
        {
          url: "/logo.jpeg",
          width: 640,
          height: 640,
          alt: brandName(locale),
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo.jpeg"],
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ar: "/ar",
        en: "/en",
      },
    },
  };
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  // H1: escape `</script>` (and U+2028/U+2029) before embedding the JSON-LD inline.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdSafe(data) }}
    />
  );
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const messages = await getMessages({ locale });
  const name = brandName(locale);

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.jpeg`,
    sameAs: [
      "https://x.com/HLShajara",
      "https://youtube.com/@HLShajara",
      "https://t.me/HLShajara",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/${locale}/record?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang={locale} dir={dir} className={fontVars}>
      <head>
        <GtmScript />
        <GaScript />
        <JsonLd data={orgSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body
        style={{
          margin: 0,
          background: "var(--bg)",
          color: "var(--fg1)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <GtmNoScript />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
