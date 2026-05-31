import { NextResponse } from "next/server";
import { db } from "@/db";
import { keyDecisions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(keyDecisions).orderBy(keyDecisions.createdAt);
    return NextResponse.json({ ok: true, decisions: rows });
  } catch (err) {
    console.error("Key decisions GET error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { decisionId, category, title, description, status, decidedBy } = body;

    if (!decisionId || !category || !title || !description) {
      return NextResponse.json(
        { ok: false, message: "decisionId, category, title, and description are required." },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(keyDecisions)
      .values({
        decisionId,
        category,
        title,
        description,
        status: status ?? "open",
        decidedAt: status === "closed" ? new Date() : null,
        decidedBy: decidedBy ?? null,
      })
      .onConflictDoUpdate({
        target: keyDecisions.decisionId,
        set: {
          category,
          title,
          description,
          status: status ?? "open",
          decidedAt: status === "closed" ? new Date() : null,
          decidedBy: decidedBy ?? null,
        },
      })
      .returning();

    return NextResponse.json({ ok: true, decision: row });
  } catch (err) {
    console.error("Key decisions POST error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
