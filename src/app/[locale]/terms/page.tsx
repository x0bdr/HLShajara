import { getTranslations } from "next-intl/server";
import { LegalNote } from "@/components";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("terms");
  const legal = await getTranslations("legal");

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 16 }}>
        {t("title")}
      </div>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>
          {t("nature")}
        </div>
        <p className="ds-body-sm">{t("natureText")}</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>
          {t("allowedUse")}
        </div>
        <p className="ds-body-sm">{t("allowedUseText")}</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>
          {t("disclaimer")}
        </div>
        <p className="ds-body-sm">{t("disclaimerText")}</p>
      </section>

      <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>
    </main>
  );
}
