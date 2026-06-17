import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components";
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
  return getPageMetadata({ locale, namespace: "policy", path: "/policy" });
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "policy" });

  return (
    <PageShell narrow>
      <div className="page-header-center">
        <h1 className="ds-h1">{t("title")}</h1>
        <p className="ds-lead">{t("lead")}</p>
      </div>

      <section className="flex-col gap-16">
        <div className="card card-pad">
          <h2 className="ds-h3 mb-12">{t("principle1Title")}</h2>
          <p className="ds-body">{t("principle1Text")}</p>
        </div>

        <div className="card card-pad">
          <h2 className="ds-h3 mb-12">{t("principle2Title")}</h2>
          <p className="ds-body">{t("principle2Text")}</p>
        </div>

        <div className="card card-pad">
          <h2 className="ds-h3 mb-12">{t("principle3Title")}</h2>
          <p className="ds-body">{t("principle3Text")}</p>
        </div>

        <div className="card card-pad">
          <h2 className="ds-h3 mb-12">{t("principle4Title")}</h2>
          <p className="ds-body">{t("principle4Text")}</p>
        </div>

        <div className="card card-pad">
          <h2 className="ds-h3 mb-12">{t("enforcementTitle")}</h2>
          <p className="ds-body">{t("enforcementText")}</p>
        </div>
      </section>
    </PageShell>
  );
}
