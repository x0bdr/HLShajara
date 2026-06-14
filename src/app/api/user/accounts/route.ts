import { NextResponse } from "next/server";
import { db } from "@/db";
import { authAccount } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorizedResponse } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 60 });
  if (!rl.ok) return rl.response;

  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const accounts = await db
      .select({
        id: authAccount.id,
        providerId: authAccount.providerId,
        accountId: authAccount.accountId,
      })
      .from(authAccount)
      .where(eq(authAccount.userId, session.user.id));

    return NextResponse.json({ ok: true, accounts });
  } catch (err) {
    console.error("List accounts error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
