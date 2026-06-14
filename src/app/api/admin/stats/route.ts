import { NextResponse } from "next/server";
import { db } from "@/db";
import { authAccount, authSession } from "@/db/schema";
import { eq, gt, sql } from "drizzle-orm";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 30 });
  if (!rl.ok) return rl.response;

  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }
  if (!hasRole(session.user.role ?? "", "admin")) {
    return forbiddenResponse("Admin access required.");
  }

  try {
    // Distinct users who signed in / linked with X (Twitter)
    const xSignupsResult = await db
      .select({ count: sql<number>`count(distinct ${authAccount.userId})` })
      .from(authAccount)
      .where(eq(authAccount.providerId, "twitter"));

    // Active sessions (not expired)
    const activeSessionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(authSession)
      .where(gt(authSession.expiresAt, sql`now()`));

    return NextResponse.json({
      ok: true,
      stats: {
        xSignups: Number(xSignupsResult[0]?.count) || 0,
        activeSessions: Number(activeSessionsResult[0]?.count) || 0,
      },
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
