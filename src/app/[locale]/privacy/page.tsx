import { getTranslations } from "next-intl/server";
import { LegalNote } from "@/components";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("privacy");
  const legal = await getTranslations("legal");

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 16 }}>
        {t("title")}
      </div>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>
          {t("dataCollected")}
        </div>
        <p className="ds-body-sm">{t("dataCollectedText")}</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>
          {t("howWeUse")}
        </div>
        <p className="ds-body-sm">{t("howWeUseText")}</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>
          {t("cookies")}
        </div>
        <p className="ds-body-sm">{t("cookiesText")}</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>
          {t("yourRights")}
        </div>
        <p className="ds-body-sm">{t("yourRightsText")}</p>
      </section>

      <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>
    </main>
  );
}
