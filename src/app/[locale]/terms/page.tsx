import { getTranslations } from "next-intl/server";
import { PageShell, LegalNote } from "@/components";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
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
        <div className="ds-h1">{t("title")}</div>
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
