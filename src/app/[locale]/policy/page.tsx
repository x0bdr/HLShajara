import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

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
  const footer = await getTranslations({ locale, namespace: "footer" });

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <nav style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href={`/${locale}`} className="btn ghost">{nav("record")}</Link>
        <Link href={`/${locale}/mission`} className="btn ghost">{nav("mission")}</Link>
        <Link href={`/${locale}/faq`} className="btn ghost">{nav("faq")}</Link>
      </nav>

      <header style={{ textAlign: "center", marginBottom: 40 }}>
        <div className="ds-h1" style={{ marginBottom: 12 }}>{t("title")}</div>
        <p className="ds-lead">{t("lead")}</p>
      </header>

      <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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

      <footer style={{ marginTop: 60, paddingTop: 24, borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <p className="ds-meta">{footer("copyright")}</p>
        <div style={{ marginTop: 8, display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href={`/${locale}/terms`} className="ds-meta">{footer("terms")}</Link>
          <Link href={`/${locale}/privacy`} className="ds-meta">{footer("privacy")}</Link>
        </div>
      </footer>
    </main>
  );
}
