export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

import { getTranslations } from "next-intl/server";
import { PageShell, HeroSection, StatsBar, PrinciplesSection, DocumentationDomains, FoundingBanner } from "@/components";
import Link from "next/link";
import { db } from "@/db";
import { entities, submissions } from "@/db/schema";
import { isNotNull, eq, sql } from "drizzle-orm";

interface StatusCounts {
  pending: number;
  underReview: number;
  alleged: number;
  investigating: number;
  indicted: number;
  sanctioned: number;
  convicted: number;
  deceased: number;
}

async function getStatusCounts(): Promise<StatusCounts> {
  try {
    const pending = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(eq(submissions.status, "pending"));
    const underReview = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(eq(submissions.status, "verified"));

    const statusRows = await db
      .select({ status: entities.status, count: sql<number>`count(*)` })
      .from(entities)
      .where(isNotNull(entities.publishedAt))
      .groupBy(entities.status);

    const byStatus: Record<string, number> = {};
    for (const row of statusRows) {
      const key = row.status === "unpublished" ? "alleged" : row.status;
      byStatus[key] = (byStatus[key] ?? 0) + (Number(row.count) || 0);
    }

    return {
      pending: Number(pending[0]?.count) || 0,
      underReview: Number(underReview[0]?.count) || 0,
      alleged: byStatus.alleged ?? 0,
      investigating: byStatus.investigating ?? 0,
      indicted: byStatus.indicted ?? 0,
      sanctioned: byStatus.sanctioned ?? 0,
      convicted: byStatus.convicted ?? 0,
      deceased: byStatus.deceased ?? 0,
    };
  } catch (err) {
    console.warn("DB unavailable during build, returning empty status counts:", (err as Error).message);
    return { pending: 0, underReview: 0, alleged: 0, investigating: 0, indicted: 0, sanctioned: 0, convicted: 0, deceased: 0 };
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const record = await getTranslations({ locale, namespace: "record" });
  const dashboard = await getTranslations({ locale, namespace: "dashboard" });

  const counts = await getStatusCounts();

  const statusCards = [
    { label: dashboard("pending"), value: counts.pending },
    { label: dashboard("underReview"), value: counts.underReview },
    { label: record("status_alleged"), value: counts.alleged },
    { label: record("status_investigating"), value: counts.investigating },
    { label: record("status_indicted"), value: counts.indicted },
    { label: record("status_sanctioned"), value: counts.sanctioned },
    { label: record("status_convicted"), value: counts.convicted },
    { label: record("status_deceased"), value: counts.deceased },
  ];

  return (
    <PageShell noPad>
      <HeroSection />
      <StatsBar
        entries={counts.alleged + counts.investigating + counts.indicted + counts.sanctioned + counts.convicted + counts.deceased}
        sources={counts.pending + counts.underReview}
        verdicts={counts.convicted}
      />
      <PrinciplesSection />
      <DocumentationDomains />
      <FoundingBanner />

      <section className="archive-section">
        <div className="archive-header">
          <h2 className="archive-title">{record("title")}</h2>
          <p className="archive-lead">{record("lead")}</p>
        </div>

        <div className="dash-grid">
          {statusCards.map((card) => (
            <div key={card.label} className="card dash-card">
              <div className="dash-value">{card.value}</div>
              <div className="dash-label">{card.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Submit CTA */}
      <section className="cta-section">
        <h2 className="section-title">{t("ctaTitle")}</h2>
        <p className="section-lead">{t("ctaText")}</p>
        <Link href={`/${locale}/submit`}>
          <button className="btn primary">{t("ctaButton")}</button>
        </Link>
      </section>
    </PageShell>
  );
}
