import { NextResponse } from "next/server";
import { db } from "@/db";
import { replies, entities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAudit } from "@/db/persist";
import { getSession, unauthorizedResponse, forbiddenResponse, require2FA } from "@/lib/session";
import { hasRole } from "@/lib/auth";

/* GET: list pending replies (admin only) */
export async function GET() {
  const session = await getSession();
  if (!session || !hasRole(session.user.role ?? "", "admin")) {
    return forbiddenResponse("Admin access required.");
  }
  if (!require2FA(session)) {
    return forbiddenResponse("Two-factor authentication required for staff.");
  }

  const pending = await db.query.replies.findMany({
    where: (r, { eq }) => eq(r.status, "pending"),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
    limit: 50,
  });
  return NextResponse.json({ ok: true, replies: pending });
}

/* POST: process a reply (approve / reject / correct / unpublish) */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasRole(session.user.role ?? "", "admin")) {
      return forbiddenResponse("Admin access required.");
    }
    if (!require2FA(session)) {
      return forbiddenResponse("Two-factor authentication required for staff.");
    }

    const body = await request.json();
    const { action, replyId, notes } = body;

    if (!["approve", "reject", "correct", "unpublish"].includes(action)) {
      return NextResponse.json({ ok: false, message: "Invalid action" }, { status: 400 });
    }

    const actorId = Number(session.user.id);
    const actorRole = (session.user.role ?? "submitter") as "submitter" | "reviewer" | "senior_reviewer" | "admin";

    const reply = await db.query.replies.findFirst({
      where: eq(replies.id, replyId),
    });

    if (!reply) {
      return NextResponse.json({ ok: false, message: "Reply not found" }, { status: 404 });
    }

    if (action === "approve") {
      await withAudit(
        { actorId, actorRole, reason: notes ?? undefined },
        () =>
          db
            .update(replies)
            .set({ status: "approved", processedAt: new Date(), processedBy: actorId, adminNote: notes ?? null })
            .where(eq(replies.id, replyId))
            .returning(),
        { action: "update", targetTable: "replies" }
      );

      if (reply.entityId) {
        await db
          .update(entities)
          .set({ rightOfReplyState: "filed", rightOfReplyText: reply.statement })
          .where(eq(entities.id, reply.entityId));
      }

      return NextResponse.json({ ok: true, message: "Reply approved and linked to entity." });
    }

    if (action === "reject") {
      await withAudit(
        { actorId, actorRole, reason: notes ?? undefined },
        () =>
          db
            .update(replies)
            .set({ status: "rejected", processedAt: new Date(), processedBy: actorId, adminNote: notes ?? null })
            .where(eq(replies.id, replyId))
            .returning(),
        { action: "update", targetTable: "replies" }
      );
      return NextResponse.json({ ok: true, message: "Reply rejected." });
    }

    if (action === "correct") {
      const correctionText = body.correctionText;
      if (!correctionText) {
        return NextResponse.json({ ok: false, message: "Correction text required." }, { status: 400 });
      }

      await withAudit(
        { actorId, actorRole, reason: notes ?? `Correction: ${correctionText}` },
        () =>
          db
            .update(replies)
            .set({ status: "corrected", processedAt: new Date(), processedBy: actorId, adminNote: notes ?? null })
            .where(eq(replies.id, replyId))
            .returning(),
        { action: "correct", targetTable: "replies" }
      );

      if (reply.entityId) {
        await db
          .update(entities)
          .set({ rightOfReplyState: "filed", rightOfReplyText: correctionText })
          .where(eq(entities.id, reply.entityId));
      }

      return NextResponse.json({ ok: true, message: "Correction applied." });
    }

    if (action === "unpublish") {
      const entityId = reply.entityId;
      if (!entityId) {
        return NextResponse.json({ ok: false, message: "Reply not linked to an entity." }, { status: 400 });
      }

      await withAudit(
        { actorId, actorRole, reason: notes ?? `Unpublish requested via reply #${replyId}` },
        () =>
          db
            .update(replies)
            .set({ status: "approved", processedAt: new Date(), processedBy: actorId, adminNote: notes ?? null })
            .where(eq(replies.id, replyId))
            .returning(),
        { action: "update", targetTable: "replies" }
      );

      await withAudit(
        { actorId, actorRole, reason: notes ?? `Unpublished per reply #${replyId}` },
        () =>
          db
            .update(entities)
            .set({ status: "unpublished", unpublishedAt: new Date() })
            .where(eq(entities.id, entityId))
            .returning(),
        { action: "unpublish", targetTable: "entities", entityId }
      );

      return NextResponse.json({ ok: true, message: "Entity unpublished." });
    }

    return NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Reply admin error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
