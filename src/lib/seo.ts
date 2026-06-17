import type { Metadata } from "next";
import { getTranslations, getMessages } from "next-intl/server";

export const SITE_ORIGIN = "https://x0bdr.github.io";
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

export const DEFAULT_OG_IMAGE = {
  url: "/logo.jpeg",
  width: 640,
  height: 640,
};

export async function buildAlternates(locale: string, path: string) {
  const canonical = path === "" ? `/${locale}` : `/${locale}${path}`;
  const languages: Record<string, string> = {};
  for (const l of ["ar", "en"]) {
    languages[l] = path === "" ? `/${l}` : `/${l}${path}`;
  }
  return { canonical, languages };
}

export async function getPageMetadata({
  locale,
  namespace,
  path,
}: {
  locale: string;
  namespace: string;
  path: string;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });
  const siteT = await getTranslations({ locale, namespace: "metadata" });
  const messages = await getMessages({ locale });
  const ns = messages[namespace as keyof typeof messages];
  const lead =
    ns && typeof ns === "object" && !Array.isArray(ns) && "lead" in ns
      ? String((ns as Record<string, unknown>).lead)
      : undefined;

  const title = t("title");
  const description =
    lead && lead.trim().length > 0
      ? lead
      : `${title} — ${siteT("description")}`;

  const pageUrl = `${SITE_URL}${path === "" ? `/${locale}` : `/${locale}${path}`}`;
  const siteName = siteT("title");

  return {
    title,
    description,
    alternates: await buildAlternates(locale, path),
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName,
      images: [{ ...DEFAULT_OG_IMAGE, alt: title }],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

export function brandName(locale: string): string {
  return locale === "ar" ? "حملة لستَ شجرة" : "HLShajara";
}
