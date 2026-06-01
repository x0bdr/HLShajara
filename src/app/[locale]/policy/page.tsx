import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { PageShell } from "@/components";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "policy" });
  const nav = await getTranslations({ locale, namespace: "nav" });

  return (
    <PageShell narrow>
      <nav style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href={`/${locale}`} className="btn ghost">{nav("record")}</Link>
        <Link href={`/${locale}/mission`} className="btn ghost">{nav("mission")}</Link>
        <Link href={`/${locale}/faq`} className="btn ghost">{nav("faq")}</Link>
      </nav>

      <div className="page-header-center">
        <div className="ds-h1">{t("title")}</div>
        <p className="ds-lead">{t("lead")}</p>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <h2 className="ds-h3" style={{ marginBottom: 12 }}>{t("principle1Title")}</h2>
          <p className="ds-body">{t("principle1Text")}</p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h2 className="ds-h3" style={{ marginBottom: 12 }}>{t("principle2Title")}</h2>
          <p className="ds-body">{t("principle2Text")}</p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h2 className="ds-h3" style={{ marginBottom: 12 }}>{t("principle3Title")}</h2>
          <p className="ds-body">{t("principle3Text")}</p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h2 className="ds-h3" style={{ marginBottom: 12 }}>{t("principle4Title")}</h2>
          <p className="ds-body">{t("principle4Text")}</p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h2 className="ds-h3" style={{ marginBottom: 12 }}>{t("enforcementTitle")}</h2>
          <p className="ds-body">{t("enforcementText")}</p>
        </div>
      </section>
    </PageShell>
  );
}
