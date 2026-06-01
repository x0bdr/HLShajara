import { getTranslations } from "next-intl/server";
import { PageShell, LegalNote } from "@/components";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
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
        <div className="ds-h1">{t("title")}</div>
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
