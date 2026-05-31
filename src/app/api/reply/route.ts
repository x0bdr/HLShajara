import { NextResponse } from "next/server";
import { db } from "@/db";
import { entities, replies } from "@/db/schema";
import { ilike } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entityName, email, statement } = body;

    if (!entityName || !email || !statement) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Try to find the entity by name (case-insensitive)
    const matched = await db
      .select()
      .from(entities)
      .where(ilike(entities.name, `%${entityName}%`))
      .limit(1);

    const entity = matched[0];

    await db.insert(replies).values({
      entityId: entity?.id ?? null,
      entityName: entity?.name ?? entityName,
      email,
      statement,
      status: "pending",
    });

    return NextResponse.json({
      ok: true,
      message: "Statement received and will be reviewed by the legal team.",
    });
  } catch (err) {
    console.error("Reply API error:", err);
    return NextResponse.json(
      { ok: false, message: "Internal error" },
      { status: 500 }
    );
  }
}
