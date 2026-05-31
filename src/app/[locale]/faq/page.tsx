import { getTranslations } from "next-intl/server";
import { LegalNote } from "@/components";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const legal = await getTranslations({ locale, namespace: "legal" });

  const faqs = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
    { q: t("q6"), a: t("a6") },
  ];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 24 }}>
        {t("title")}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {faqs.map((faq, i) => (
          <div key={i} className="card" style={{ padding: "16px 18px" }}>
            <div className="ds-h3" style={{ marginBottom: 6 }}>
              {faq.q}
            </div>
            <p
              className="ds-body-sm"
              style={{ color: "var(--fg2)", lineHeight: 1.6 }}
            >
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>
      </div>
    </main>
  );
}
