import { getTranslations } from "next-intl/server";
import { PageShell, LegalNote } from "@/components";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default async function MissionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "mission" });
  const legal = await getTranslations({ locale, namespace: "legal" });

  return (
    <PageShell narrow>
      <div className="page-header-center">
        <div className="ds-h1">{t("title")}</div>
      </div>

      <div className="form-section">
        <div className="form-section-title">{t("whatWeDo")}</div>
        <p className="ds-body">{t("whatWeDoText")}</p>
      </div>

      <div className="form-section">
        <div className="form-section-title">{t("whatWeDont")}</div>
        <ul className="list-pad">
          <li>{t("dont1")}</li>
          <li>{t("dont2")}</li>
          <li>{t("dont3")}</li>
          <li>{t("dont4")}</li>
          <li>{t("dont5")}</li>
        </ul>
      </div>

      <div className="form-section">
        <div className="form-section-title">{t("codeOfConduct")}</div>
        <p className="ds-body">{t("codeOfConductText")}</p>
      </div>

      <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>
    </PageShell>
  );
}
