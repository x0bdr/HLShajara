import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession, forbiddenResponse } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { rateLimitResponse } from "@/lib/rate-limit";
import { withAudit } from "@/db/persist";

/* ---------- GET: list posts or single post ---------- */
export async function GET(request: Request) {
  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 60 });
  if (!rl.ok) return rl.response;

  const session = await getSession();
  if (!session || !hasRole(session.user.role ?? "", "reviewer")) {
    return forbiddenResponse("Reviewer access required.");
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const row = await db
        .select()
        .from(posts)
        .where(eq(posts.id, Number(id)))
        .limit(1);
      if (!row.length) {
        return NextResponse.json({ ok: false, message: "Post not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, post: row[0] });
    }

    const allPosts = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        locale: posts.locale,
        status: posts.status,
        title: posts.title,
        excerpt: posts.excerpt,
        coverImageUrl: posts.coverImageUrl,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        authorId: posts.authorId,
      })
      .from(posts)
      .orderBy(desc(posts.createdAt));

    return NextResponse.json({ ok: true, posts: allPosts });
  } catch (err) {
    console.error("Posts admin GET error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}

/* ---------- POST: create post ---------- */
export async function POST(request: Request) {
  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 30 });
  if (!rl.ok) return rl.response;

  const session = await getSession();
  if (!session || !hasRole(session.user.role ?? "", "reviewer")) {
    return forbiddenResponse("Reviewer access required.");
  }

  try {
    const body = await request.json();
    const { slug, locale, title, excerpt, body: postBody, coverImageUrl, status, publishedAt } = body;

    if (!slug || !locale || !title || !postBody) {
      return NextResponse.json({ ok: false, message: "Missing required fields: slug, locale, title, body" }, { status: 400 });
    }

    // Check slug uniqueness per locale
    const existing = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.locale, locale)))
      .limit(1);

    if (existing.length) {
      return NextResponse.json({ ok: false, message: "Slug already exists for this locale" }, { status: 409 });
    }

    const actorId = Number(session.user.id);
    const actorRole = (session.user.role ?? "submitter") as "submitter" | "reviewer" | "senior_reviewer" | "admin";

    const [post] = await withAudit(
      { actorId, actorRole },
      () =>
        db
          .insert(posts)
          .values({
            slug,
            locale,
            title,
            excerpt: excerpt || null,
            body: postBody,
            coverImageUrl: coverImageUrl || null,
            status: status || "draft",
            publishedAt: status === "published" && publishedAt ? new Date(publishedAt) : status === "published" ? new Date() : null,
          })
          .returning(),
      { action: "create", targetTable: "posts" }
    );

    return NextResponse.json({ ok: true, post });
  } catch (err) {
    console.error("Posts admin POST error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}

/* ---------- PATCH: update post ---------- */
export async function PATCH(request: Request) {
  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 30 });
  if (!rl.ok) return rl.response;

  const session = await getSession();
  if (!session || !hasRole(session.user.role ?? "", "reviewer")) {
    return forbiddenResponse("Reviewer access required.");
  }

  try {
    const body = await request.json();
    const { id, slug, locale, title, excerpt, body: postBody, coverImageUrl, status, publishedAt } = body;

    if (!id) {
      return NextResponse.json({ ok: false, message: "Post ID required" }, { status: 400 });
    }

    // Check slug uniqueness if changing slug or locale
    const current = await db.select().from(posts).where(eq(posts.id, Number(id))).limit(1);
    if (!current.length) {
      return NextResponse.json({ ok: false, message: "Post not found" }, { status: 404 });
    }

    if (slug && locale && (slug !== current[0].slug || locale !== current[0].locale)) {
      const conflicting = await db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.slug, slug), eq(posts.locale, locale)))
        .limit(1);
      if (conflicting.length && conflicting[0].id !== Number(id)) {
        return NextResponse.json({ ok: false, message: "Slug already exists for this locale" }, { status: 409 });
      }
    }

    const actorId = Number(session.user.id);
    const actorRole = (session.user.role ?? "submitter") as "submitter" | "reviewer" | "senior_reviewer" | "admin";

    const updateData: Partial<typeof posts.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (slug !== undefined) updateData.slug = slug;
    if (locale !== undefined) updateData.locale = locale;
    if (title !== undefined) updateData.title = title;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (postBody !== undefined) updateData.body = postBody;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "published" && !current[0].publishedAt) {
        updateData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
      }
      if (status === "draft") {
        updateData.publishedAt = null;
      }
    }

    const [post] = await withAudit(
      { actorId, actorRole },
      () => db.update(posts).set(updateData).where(eq(posts.id, Number(id))).returning(),
      { action: "update", targetTable: "posts", targetId: Number(id) }
    );

    return NextResponse.json({ ok: true, post });
  } catch (err) {
    console.error("Posts admin PATCH error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}

/* ---------- DELETE: soft-delete (archive) ---------- */
export async function DELETE(request: Request) {
  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 20 });
  if (!rl.ok) return rl.response;

  const session = await getSession();
  if (!session || !hasRole(session.user.role ?? "", "reviewer")) {
    return forbiddenResponse("Reviewer access required.");
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, message: "Post ID required" }, { status: 400 });
    }

    const actorId = Number(session.user.id);
    const actorRole = (session.user.role ?? "submitter") as "submitter" | "reviewer" | "senior_reviewer" | "admin";

    await withAudit(
      { actorId, actorRole },
      () =>
        db
          .update(posts)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(posts.id, Number(id)))
          .returning(),
      { action: "update", targetTable: "posts", targetId: Number(id) }
    );

    return NextResponse.json({ ok: true, message: "Post archived." });
  } catch (err) {
    console.error("Posts admin DELETE error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
