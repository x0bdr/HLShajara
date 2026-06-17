export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

import { PageShell, HeroSection, StatsBar, PrinciplesSection } from "@/components";
import { db } from "@/db";
import { entities, submissions } from "@/db/schema";
import { isNotNull, eq, sql } from "drizzle-orm";

async function getStatusCounts() {
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
  await params;
  const counts = await getStatusCounts();

  return (
    <PageShell noPad>
      <HeroSection />
      <StatsBar
        entries={counts.alleged + counts.investigating + counts.indicted + counts.sanctioned + counts.convicted + counts.deceased}
        sources={counts.pending + counts.underReview}
        verdicts={counts.convicted}
      />
      <PrinciplesSection />
    </PageShell>
  );
}
