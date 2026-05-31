import { NextResponse } from "next/server";
import { db } from "@/db";
import { entities, submissions, replies } from "@/db/schema";
import { sql } from "drizzle-orm";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 60 });
  if (!rl.ok) return rl.response;

  try {
    const publishedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(entities)
      .where(sql`${entities.publishedAt} IS NOT NULL AND ${entities.status} != 'unpublished'`);

    const rejectedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(sql`${submissions.status} = 'rejected'`);

    const correctedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(replies)
      .where(sql`${replies.status} = 'corrected'`);

    const pendingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(sql`${submissions.status} = 'pending'`);

    const verifiedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(sql`${submissions.status} = 'verified'`);

    return NextResponse.json({
      ok: true,
      stats: {
        published: publishedCount[0]?.count ?? 0,
        rejected: rejectedCount[0]?.count ?? 0,
        corrected: correctedCount[0]?.count ?? 0,
        pending: pendingCount[0]?.count ?? 0,
        underReview: verifiedCount[0]?.count ?? 0,
      },
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
