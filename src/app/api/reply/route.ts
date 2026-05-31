import { NextResponse } from "next/server";
import { db } from "@/db";
import { entities, replies } from "@/db/schema";
import { ilike, isNotNull, and } from "drizzle-orm";
import { withAudit } from "@/db/persist";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 5 });
  if (!rl.ok) return rl.response;

  try {
    const body = await request.json();
    const { entityName, email, statement } = body;

    if (!entityName || !email || !statement) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Try to find the entity by name (case-insensitive), only published entities
    const matched = await db
      .select()
      .from(entities)
      .where(
        and(ilike(entities.name, `%${entityName}%`), isNotNull(entities.publishedAt))
      )
      .limit(1);

    const entity = matched[0];

    const [reply] = await withAudit(
      { actorId: 0, actorRole: "submitter", reason: `Reply from ${email}` },
      () =>
        db
          .insert(replies)
          .values({
            entityId: entity?.id ?? null,
            entityName: entity?.name ?? entityName,
            email,
            statement,
            status: "pending",
          })
          .returning(),
      { action: "create", targetTable: "replies" }
    );

    return NextResponse.json({
      ok: true,
      message: "Statement received and will be reviewed by the legal team.",
      replyId: reply.id,
    });
  } catch (err) {
    console.error("Reply API error:", err);
    return NextResponse.json(
      { ok: false, message: "Internal error" },
      { status: 500 }
    );
  }
}
