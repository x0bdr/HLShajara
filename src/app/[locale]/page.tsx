export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

import { getTranslations } from "next-intl/server";
import { EvidenceCard, LegalNote, Button } from "@/components";
import type { Entity } from "@/lib/types";
import Link from "next/link";

const DEMO_ENTITIES: Entity[] = [
  {
    id: "ent-001",
    type: "individual",
    name: "فلان الفلاني",
    role: "ضابط بفرع الأمن العسكري ٢٧٩",
    status: "convicted",
    evidence: 4,
    version: 3,
    rightOfReply: "none",
    allegations: [
      {
        description:
          "قيادة عمليات اعتقال تعسفي وتعذيب في فرع ٢٧٩ بدمشق خلال الفترة ٢٠١١–٢٠١٣.",
        period: "٢٠١١–٢٠١٣",
        location: "دمشق، فرع الأمن العسكري ٢٧٩",
        classification: "جرائم ضد الإنسانية",
        sources: [
          { tier: "A", title: "تقرير لجنة التحقيق الدولية", publisher: "UN CoI Syria", date: "2013-08-15" },
          { tier: "A", title: "حكم محكمة كوبلنز", publisher: "Oberlandesgericht Koblenz", date: "2022-01-13" },
        ],
      },
    ],
  },
  {
    id: "ent-002",
    type: "military_unit",
    name: "الفرقة الرابعة",
    role: "وحدة عسكرية تابعة للنظام السابق",
    status: "sanctioned",
    evidence: 3,
    version: 2,
    rightOfReply: "filed",
    allegations: [
      {
        description:
          "مسؤولة عن هجمات كيميائية على مدينة خان شيخون في أبريل ٢٠١٧.",
        period: "٢٠١٧-04-04",
        location: "خان شيخون، إدلب",
        classification: "جريمة حرب",
        sources: [
          { tier: "A", title: "تقرير آلية التحقيق المشتركة", publisher: "UN-OPCW JIM", date: "2017-10-26" },
        ],
      },
    ],
  },
  {
    id: "ent-003",
    type: "individual",
    name: "فلان الثاني",
    role: "مسؤول أمني سابق",
    status: "indicted",
    evidence: 2,
    version: 1,
    rightOfReply: "none",
    allegations: [
      {
        description:
          "التورط في قمع المتظاهرين السلميين في مدينة درعا عام ٢٠١١.",
        period: "٢٠١١-03–2011-05",
        location: "درعا",
        classification: "جرائم ضد الإنسانية",
        sources: [
          { tier: "B", title: "تقرير منظمة العفو الدولية", publisher: "Amnesty International", date: "2011-07-06" },
          { tier: "C", title: "تحقيق صحفي", publisher: "Al Jazeera", date: "2011-04-25" },
        ],
      },
    ],
  },
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const legal = await getTranslations({ locale, namespace: "legal" });
  const footer = await getTranslations({ locale, namespace: "footer" });
  const labels = await getTranslations({ locale, namespace: "labels" });

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px" }}>
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 32,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Link href={`/${locale}/record`} className="btn ghost">
          {nav("record")}
        </Link>
        <Link href={`/${locale}/mission`} className="btn ghost">
          {nav("mission")}
        </Link>
        <Link href={`/${locale}/faq`} className="btn ghost">
          {nav("faq")}
        </Link>
        <Link href={`/${locale}/reply`} className="btn ghost">
          {nav("reply")}
        </Link>
      </nav>

      {/* Hero */}
      <header style={{ textAlign: "center", marginBottom: 48 }}>
        <div
          className="ds-display"
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)", marginBottom: 12 }}
        >
          {t("title")}
        </div>
        <div className="ds-h2" style={{ color: "var(--fg2)", marginBottom: 8 }}>
          {t("subtitle")}
        </div>
        <p className="ds-lead" style={{ maxWidth: 600, margin: "0 auto" }}>
          {t("lead")}
        </p>
      </header>

      {/* Legal note */}
      <div style={{ marginBottom: 32 }}>
        <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>
      </div>

      {/* Stats bar */}
      <section
        style={{
          display: "flex",
          gap: 24,
          justifyContent: "center",
          marginBottom: 40,
          flexWrap: "wrap",
        }}
      >
        {[
          { n: "3", l: t("stats.entries") },
          { n: "2", l: t("stats.sources") },
          { n: "1", l: t("stats.verdicts") },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              textAlign: "center",
              padding: "16px 28px",
              background: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="ds-h2"
              style={{ color: "var(--brand)", marginBottom: 4 }}
            >
              {s.n}
            </div>
            <div className="ds-caption">{s.l}</div>
          </div>
        ))}
      </section>

      {/* Evidence cards */}
      <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="ds-h3" style={{ marginBottom: 4 }}>
          {t("recordTitle")}
        </div>
        {DEMO_ENTITIES.map((e) => (
          <EvidenceCard
            key={e.id}
            entity={e}
            lang={locale as "ar" | "en"}
          />
        ))}
      </section>

      {/* Submit CTA */}
      <section style={{ marginTop: 40, textAlign: "center" }}>
        <div className="ds-h3" style={{ marginBottom: 12 }}>
          {t("ctaTitle")}
        </div>
        <p
          className="ds-body"
          style={{
            maxWidth: 500,
            margin: "0 auto 16px",
            color: "var(--fg2)",
          }}
        >
          {t("ctaText")}
        </p>
        <Link href={`/${locale}/submit`}>
          <Button variant="primary">{t("ctaButton")}</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 60,
          paddingTop: 24,
          borderTop: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <p className="ds-meta">{footer("copyright")}</p>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <Link href={`/${locale}/terms`} className="ds-meta">
            {footer("terms")}
          </Link>
          <Link href={`/${locale}/privacy`} className="ds-meta">
            {footer("privacy")}
          </Link>
        </div>
      </footer>
    </main>
  );
}
