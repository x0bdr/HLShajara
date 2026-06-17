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
  return getPageMetadata({ locale, namespace: "privacy", path: "/privacy" });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  const legal = await getTranslations({ locale, namespace: "legal" });

  return (
    <PageShell narrow>
      <div className="page-header-center">
        <h1 className="ds-h1">{t("title")}</h1>
      </div>

      <div className="form-section">
        <div className="form-section-title">{t("dataCollected")}</div>
        <p className="ds-body-sm">{t("dataCollectedText")}</p>
      </div>

      <div className="form-section">
        <div className="form-section-title">{t("howWeUse")}</div>
        <p className="ds-body-sm">{t("howWeUseText")}</p>
      </div>

      <div className="form-section">
        <div className="form-section-title">{t("cookies")}</div>
        <p className="ds-body-sm">{t("cookiesText")}</p>
      </div>

      <div className="form-section">
        <div className="form-section-title">{t("yourRights")}</div>
        <p className="ds-body-sm">{t("yourRightsText")}</p>
      </div>

      <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>
    </PageShell>
  );
}
