export const dynamic = "force-static";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { entities, allegations, sources, allegationSources } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  try {
    if (id) {
      const entity = await db.query.entities.findFirst({
        where: eq(entities.publicId, id),
      });

      if (!entity) {
        return NextResponse.json({ ok: false, message: "Entity not found" }, { status: 404 });
      }

      const entityAllegations = await db.query.allegations.findMany({
        where: eq(allegations.entityId, entity.id),
      });

      const allegationsWithSources = await Promise.all(
        entityAllegations.map(async (a) => {
          const links = await db
            .select({ source: sources })
            .from(allegationSources)
            .innerJoin(sources, eq(allegationSources.sourceId, sources.id))
            .where(eq(allegationSources.allegationId, a.id));
          return { ...a, sources: links.map((l) => l.source) };
        })
      );

      return NextResponse.json({
        ok: true,
        entity: { ...entity, allegations: allegationsWithSources },
      });
    }

    // List entities with optional filters
    const conditions = [];
    if (status) conditions.push(eq(entities.status, status as any));
    if (type) conditions.push(eq(entities.type, type as any));

    const allEntities = await db
      .select()
      .from(entities)
      .where(conditions.length ? conditions[0] : undefined)
      .limit(100);
    return NextResponse.json({ ok: true, entities: allEntities });
  } catch (err) {
    console.error("Entity API error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
