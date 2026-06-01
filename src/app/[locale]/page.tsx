export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

import { getTranslations } from "next-intl/server";
import { PageShell, HeroSection, StatsBar, ArchiveHome, PrinciplesSection, DocumentationDomains, FoundingBanner } from "@/components";
import type { Entity, SourceTier } from "@/lib/types";
import Link from "next/link";
import { db } from "@/db";
import { entities, allegations, sources, allegationSources } from "@/db/schema";
import { isNotNull, eq } from "drizzle-orm";

async function getPublishedEntities(page = 1, limit = 20): Promise<{ entities: Entity[]; hasMore: boolean }> {
  try {
    const offset = (page - 1) * limit;
    const rows = await db
      .select()
      .from(entities)
      .where(isNotNull(entities.publishedAt))
      .limit(limit + 1)
      .offset(offset);

    const result: Entity[] = [];
    for (const e of rows) {
      const als = await db
        .select()
        .from(allegations)
        .where(eq(allegations.entityId, e.id));

      const entityAllegations = [];
      for (const a of als) {
        const srcLinks = await db
          .select({ s: sources })
          .from(allegationSources)
          .innerJoin(sources, eq(allegationSources.sourceId, sources.id))
          .where(eq(allegationSources.allegationId, a.id));

        entityAllegations.push({
          description: a.description,
          period: a.period ?? "",
          location: a.location ?? "",
          classification: a.classification ?? undefined,
          sources: srcLinks.map(({ s }) => ({
            tier: s.tier as SourceTier,
            title: s.title,
            publisher: s.publisher,
            date: s.date,
          })),
        });
      }

      result.push({
        id: e.publicId,
        type: e.type as Entity["type"],
        name: e.name,
        role: e.role,
        status: (e.status === "unpublished" ? "alleged" : e.status) as Entity["status"],
        evidence: Number(e.evidenceLevel) as Entity["evidence"],
        version: e.version,
        rightOfReply: (e.rightOfReplyState ?? "none") as Entity["rightOfReply"],
        allegations: entityAllegations as Entity["allegations"],
      });
    }

    const hasMore = rows.length > limit;
    return { entities: hasMore ? result.slice(0, limit) : result, hasMore };
  } catch (err) {
    console.warn("DB unavailable during build, returning empty entities:", (err as Error).message);
    return { entities: [], hasMore: false };
  }
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const t = await getTranslations({ locale, namespace: "home" });
  const legal = await getTranslations({ locale, namespace: "legal" });

  const { entities: published, hasMore } = await getPublishedEntities(page, 20);
  const entryCount = published.length;
  const sourceCount = published.reduce(
    (sum, e) => sum + e.allegations.reduce((aSum, a) => aSum + a.sources.length, 0),
    0
  );
  const verdictCount = published.filter((e) => e.status === "convicted").length;

  return (
    <PageShell noPad>
      <HeroSection />
      <StatsBar entries={entryCount} sources={sourceCount} verdicts={verdictCount} />
      <PrinciplesSection />
      <DocumentationDomains />
      <FoundingBanner />

      <section className="archive-section">
        <div className="archive-header">
          <h2 className="archive-title">{t("recordTitle")}</h2>
          <p className="archive-lead">{t("lead")}</p>
        </div>

        <div className="legal">
          <div className="t">{legal("title")}</div>
          <p>{legal("note")}</p>
        </div>

        <div className="mt-20">
          <ArchiveHome entities={published} showHeader={false} />
        </div>

        {/* Pagination */}
        <div className="pagination-bar">
          <Link href={`/${locale}?page=${Math.max(1, page - 1)}`}>
            <button className="btn secondary" disabled={page <= 1}>
              {locale === "ar" ? "السابق" : "Previous"}
            </button>
          </Link>
          <span className="ds-body-sm text-fg2">
            {locale === "ar" ? `الصفحة ${page}` : `Page ${page}`}
          </span>
          <Link href={`/${locale}?page=${page + 1}`}>
            <button className="btn secondary" disabled={!hasMore}>
              {locale === "ar" ? "التالي" : "Next"}
            </button>
          </Link>
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
