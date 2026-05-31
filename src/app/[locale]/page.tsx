export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

import { getTranslations } from "next-intl/server";
import { Header, Footer, HeroSection, StatsBar, ArchiveHome } from "@/components";
import type { Entity, SourceTier } from "@/lib/types";
import Link from "next/link";
import { db } from "@/db";
import { entities, allegations, sources, allegationSources } from "@/db/schema";
import { isNotNull, eq } from "drizzle-orm";

async function getPublishedEntities(): Promise<Entity[]> {
  try {
    const rows = await db
      .select()
      .from(entities)
      .where(isNotNull(entities.publishedAt))
      .limit(50);

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
    return result;
  } catch (err) {
    console.warn("DB unavailable during build, returning empty entities:", (err as Error).message);
    return [];
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const legal = await getTranslations({ locale, namespace: "legal" });

  const published = await getPublishedEntities();
  const entryCount = published.length;
  const sourceCount = published.reduce(
    (sum, e) => sum + e.allegations.reduce((aSum, a) => aSum + a.sources.length, 0),
    0
  );
  const verdictCount = published.filter((e) => e.status === "convicted").length;

  return (
    <>
      <Header />
      <HeroSection />
      <StatsBar entries={entryCount} sources={sourceCount} verdicts={verdictCount} />

      <div className="section-pad" style={{ paddingBlock: "24px 0" }}>
        <div className="legal">
          <div className="t">{legal("title")}</div>
          <p>{legal("note")}</p>
        </div>
      </div>

      <ArchiveHome entities={published} showHeader={false} />

      {/* Submit CTA */}
      <section className="cta-section">
        <h2 className="section-title">{t("ctaTitle")}</h2>
        <p className="section-lead">{t("ctaText")}</p>
        <Link href={`/${locale}/submit`}>
          <button className="btn primary">{t("ctaButton")}</button>
        </Link>
      </section>

      <Footer />
    </>
  );
}
