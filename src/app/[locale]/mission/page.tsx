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
  return getPageMetadata({ locale, namespace: "mission", path: "/mission" });
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
        <h1 className="ds-h1">{t("title")}</h1>
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
