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
      <div className="ds-h1" style={{ marginBottom: 16 }}>
        {t("title")}
      </div>

      <section style={{ marginBottom: 32 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>
          {t("whatWeDo")}
        </div>
        <p className="ds-body">{t("whatWeDoText")}</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>
          {t("whatWeDont")}
        </div>
        <ul
          style={{
            paddingInlineStart: 20,
            color: "var(--fg1)",
            lineHeight: 1.7,
          }}
        >
          <li>{t("dont1")}</li>
          <li>{t("dont2")}</li>
          <li>{t("dont3")}</li>
          <li>{t("dont4")}</li>
          <li>{t("dont5")}</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>
          {t("codeOfConduct")}
        </div>
        <p className="ds-body">{t("codeOfConductText")}</p>
      </section>

      <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>
    </PageShell>
  );
}
