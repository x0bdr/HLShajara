import { NextResponse } from "next/server";
import { db } from "@/db";
import { entities, allegations, sources, allegationSources } from "@/db/schema";
import { eq, or, ilike, and } from "drizzle-orm";
import type { Entity, EvidenceLevel, EntityStatus, EntityType } from "@/lib/types";

function mapEntity(
  row: typeof entities.$inferSelect,
  entityAllegations: (typeof allegations.$inferSelect & { sources: (typeof sources.$inferSelect)[] })[]
): Entity {
  return {
    id: row.publicId,
    type: row.type as EntityType,
    name: row.name,
    role: row.role,
    status: row.status as EntityStatus,
    evidence: Number(row.evidenceLevel) as EvidenceLevel,
    version: row.version,
    rightOfReply: (row.rightOfReplyState as "none" | "filed") || "none",
    allegations: entityAllegations.map((a) => ({
      description: a.description,
      period: a.period || "",
      location: a.location || "",
      classification: a.classification || undefined,
      sources: a.sources.map((s) => ({
        tier: s.tier as "A" | "B" | "C",
        title: s.title,
        publisher: s.publisher || "",
        date: s.date || "",
        url: s.url || undefined,
      })),
    })),
  };
}

async function fetchAllegationsForEntity(entityId: number) {
  const entityAllegations = await db.query.allegations.findMany({
    where: eq(allegations.entityId, entityId),
  });

  return Promise.all(
    entityAllegations.map(async (a) => {
      const links = await db
        .select({ source: sources })
        .from(allegationSources)
        .innerJoin(sources, eq(allegationSources.sourceId, sources.id))
        .where(eq(allegationSources.allegationId, a.id));
      return { ...a, sources: links.map((l) => l.source) };
    })
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  try {
    if (id) {
      const row = await db.query.entities.findFirst({
        where: eq(entities.publicId, id),
      });

      if (!row) {
        return NextResponse.json(
          { ok: false, message: "Entity not found" },
          { status: 404 }
        );
      }

      const entityAllegations = await fetchAllegationsForEntity(row.id);
      return NextResponse.json({
        ok: true,
        entity: mapEntity(row, entityAllegations),
      });
    }

    // Build conditions
    const conditions = [];
    if (status) conditions.push(eq(entities.status, status as any));
    if (type) conditions.push(eq(entities.type, type as any));

    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          ilike(entities.name, pattern),
          ilike(entities.nameEn, pattern),
          ilike(entities.role, pattern),
          ilike(entities.roleEn, pattern)
        )
      );
    }

    const whereClause = conditions.length
      ? conditions.length === 1
        ? conditions[0]
        : and(...conditions)
      : undefined;

    const rows = await db
      .select()
      .from(entities)
      .where(whereClause)
      .limit(100);

    const mapped = await Promise.all(
      rows.map(async (row) => {
        const entityAllegations = await fetchAllegationsForEntity(row.id);
        return mapEntity(row, entityAllegations);
      })
    );

    return NextResponse.json({ ok: true, entities: mapped });
  } catch (err) {
    console.error("Entity API error:", err);
    return NextResponse.json(
      { ok: false, message: "Internal error" },
      { status: 500 }
    );
  }
}
