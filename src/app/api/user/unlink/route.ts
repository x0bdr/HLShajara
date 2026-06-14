import { NextResponse } from "next/server";
import { getSession, unauthorizedResponse } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 20 });
  if (!rl.ok) return rl.response;

  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { providerId, accountId } = body;

    if (!providerId) {
      return NextResponse.json({ ok: false, message: "Provider ID required" }, { status: 400 });
    }

    // Forward to Better Auth's unlink-account endpoint
    const cookie = request.headers.get("cookie") || "";
    const authRes = await fetch(new URL("/api/auth/unlink-account", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      body: JSON.stringify({ providerId, accountId }),
    });

    if (!authRes.ok) {
      const data = await authRes.json().catch(() => ({}));
      return NextResponse.json({ ok: false, message: data.message || "Unlink failed" }, { status: authRes.status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unlink error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
