import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageShell, LegalNote } from "@/components";
import { getPageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getPageMetadata({ locale, namespace: "terms", path: "/terms" });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  const legal = await getTranslations({ locale, namespace: "legal" });

  return (
    <PageShell narrow>
      <div className="page-header-center">
        <h1 className="ds-h1">{t("title")}</h1>
      </div>

      <div className="form-section">
        <div className="form-section-title">{t("nature")}</div>
        <p className="ds-body-sm">{t("natureText")}</p>
      </div>

      <div className="form-section">
        <div className="form-section-title">{t("allowedUse")}</div>
        <p className="ds-body-sm">{t("allowedUseText")}</p>
      </div>

      <div className="form-section">
        <div className="form-section-title">{t("disclaimer")}</div>
        <p className="ds-body-sm">{t("disclaimerText")}</p>
      </div>

      <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>
    </PageShell>
  );
}
