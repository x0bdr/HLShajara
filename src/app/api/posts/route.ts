import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") || "ar";
  const slug = searchParams.get("slug");

  try {
    if (slug) {
      const row = await db
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.slug, slug),
            eq(posts.locale, locale),
            eq(posts.status, "published")
          )
        )
        .limit(1);

      if (!row.length) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ post: row[0] });
    }

    const rows = await db
      .select()
      .from(posts)
      .where(and(eq(posts.locale, locale), eq(posts.status, "published")))
      .orderBy(desc(posts.publishedAt));

    return NextResponse.json({ posts: rows });
  } catch (err) {
    console.error("Posts API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
