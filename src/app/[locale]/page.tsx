export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

import { getTranslations } from "next-intl/server";
import { EvidenceCard, LegalNote, Button } from "@/components";
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
      .limit(10);

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
    // DB unavailable during build — return empty
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
  const nav = await getTranslations({ locale, namespace: "nav" });
  const legal = await getTranslations({ locale, namespace: "legal" });
  const footer = await getTranslations({ locale, namespace: "footer" });
  const labels = await getTranslations({ locale, namespace: "labels" });

  const published = await getPublishedEntities();
  const entryCount = published.length;
  const sourceCount = published.reduce((sum, e) => sum + e.allegations.reduce((aSum, a) => aSum + a.sources.length, 0), 0);
  const verdictCount = published.filter((e) => e.status === "convicted").length;

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
        <Link href={`/${locale}/dashboard`} className="btn ghost">
          {nav("dashboard")}
        </Link>
        <Link href={`/${locale}/policy`} className="btn ghost">
          {nav("policy")}
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
          { n: String(entryCount), l: t("stats.entries") },
          { n: String(sourceCount), l: t("stats.sources") },
          { n: String(verdictCount), l: t("stats.verdicts") },
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
        {published.length === 0 ? (
          <p className="ds-body" style={{ color: "var(--fg2)", textAlign: "center", padding: "40px 0" }}>
            {locale === "ar" ? "لا توجد مدخلات منشورة بعد." : "No published entries yet."}
          </p>
        ) : (
          published.map((e) => (
            <EvidenceCard
              key={e.id}
              entity={e}
              lang={locale as "ar" | "en"}
            />
          ))
        )}
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
