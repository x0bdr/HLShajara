import { NextResponse } from "next/server";
import { db } from "@/db";
import { submissions, entities, allegations, sources, allegationSources } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validatePublication, withAudit } from "@/db/persist";
import { getSession, unauthorizedResponse, forbiddenResponse, require2FA } from "@/lib/session";
import { hasRole, canPublish } from "@/lib/auth";

/* ---------- GET: list pending submissions ---------- */
export async function GET() {
  const session = await getSession();
  if (!session || !hasRole(session.user.role ?? "", "reviewer")) {
    return forbiddenResponse("Reviewer access required.");
  }
  if (!require2FA(session)) {
    return forbiddenResponse("Two-factor authentication required for staff.");
  }

  const pending = await db.query.submissions.findMany({
    where: (s, { eq }) => eq(s.status, "pending"),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
    limit: 50,
  });
  return NextResponse.json({ ok: true, submissions: pending });
}

/* ---------- POST: review action (approve / reject / publish) ---------- */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse("Authentication required.");
    }
    if (!require2FA(session)) {
      return forbiddenResponse("Two-factor authentication required for staff.");
    }

    const body = await request.json();
    const { action, submissionId, notes } = body;

    if (!["approve", "reject", "publish"].includes(action)) {
      return NextResponse.json({ ok: false, message: "Invalid action" }, { status: 400 });
    }

    const actorId = Number(session.user.id);
    const actorRole = (session.user.role ?? "submitter") as "submitter" | "reviewer" | "senior_reviewer" | "admin";

    if (action === "publish" && !canPublish(actorRole)) {
      return forbiddenResponse("Senior reviewer or admin required to publish.");
    }

    if ((action === "approve" || action === "reject") && !hasRole(actorRole, "reviewer")) {
      return forbiddenResponse("Reviewer access required.");
    }

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json({ ok: false, message: "Submission not found" }, { status: 404 });
    }

    if (action === "reject") {
      await withAudit(
        { actorId, actorRole, reason: notes ?? undefined },
        () =>
          db
            .update(submissions)
            .set({ status: "rejected", rejectionNote: notes ?? null, reviewedBy: actorId, reviewedAt: new Date() })
            .where(eq(submissions.id, submissionId))
            .returning(),
        { action: "reject", targetTable: "submissions", submissionId }
      );
      return NextResponse.json({ ok: true, message: "Submission rejected." });
    }

    if (action === "approve") {
      await withAudit(
        { actorId, actorRole },
        () =>
          db
            .update(submissions)
            .set({ status: "verified", reviewedBy: actorId, reviewedAt: new Date() })
            .where(eq(submissions.id, submissionId))
            .returning(),
        { action: "verify", targetTable: "submissions", submissionId }
      );
      return NextResponse.json({ ok: true, message: "Submission verified. Awaiting second review or publish." });
    }

    if (action === "publish") {
      // Hard boundary: check lawyer sign-off for living persons
      const pubCheck = validatePublication({
        entityName: submission.entityName,
        isDeceased: false, // We don't know from submission alone — would need entity lookup
        hasLawyerSignOff: body.hasLawyerSignOff === true,
        sourceCount: Array.isArray(submission.sourceLinks) ? submission.sourceLinks.length : 0,
      });

      if (!pubCheck.ok) {
        return NextResponse.json({ ok: false, code: pubCheck.code, message: pubCheck.message }, { status: 403 });
      }

      // Create entity from submission
      const publicId = `ent-${Date.now().toString(36)}`;
      const [entity] = await withAudit(
        { actorId, actorRole, reason: notes ?? undefined },
        () =>
          db
            .insert(entities)
            .values({
              publicId,
              type: submission.entityType,
              name: submission.entityName,
              role: submission.entityRole,
              status: "alleged",
              evidenceLevel: "1",
              publishedAt: new Date(),
            })
            .returning(),
        { action: "publish", targetTable: "entities" }
      );

      const [allegation] = await withAudit(
        { actorId, actorRole },
        () =>
          db
            .insert(allegations)
            .values({
              entityId: entity.id,
              description: submission.allegationDescription,
              period: submission.allegationPeriod,
              location: submission.allegationLocation,
              classification: submission.allegationClassification,
            })
            .returning(),
        { action: "create", targetTable: "allegations", entityId: entity.id }
      );

      // Create sources from submission links
      const sourceLinks = Array.isArray(submission.sourceLinks) ? submission.sourceLinks : [];
      for (const link of sourceLinks) {
        const [source] = await withAudit(
          { actorId, actorRole },
          () =>
            db
              .insert(sources)
              .values({
                tier: "C",
                title: link.title ?? "Untitled source",
                publisher: "Submitted source",
                date: new Date().toISOString().slice(0, 10),
                url: link.url,
              })
              .returning(),
          { action: "create", targetTable: "sources", entityId: entity.id }
        );

        await db.insert(allegationSources).values({
          allegationId: allegation.id,
          sourceId: source.id,
        });
      }

      await withAudit(
        { actorId, actorRole },
        () =>
          db
            .update(submissions)
            .set({ status: "published", publishedBy: actorId, publishedAt: new Date() })
            .where(eq(submissions.id, submissionId))
            .returning(),
        { action: "publish", targetTable: "submissions", submissionId, entityId: entity.id }
      );

      return NextResponse.json({ ok: true, entityId: entity.publicId, message: "Published successfully." });
    }

    return NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Review error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
