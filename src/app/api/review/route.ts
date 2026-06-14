import { NextResponse } from "next/server";
import { db } from "@/db";
import { submissions, entities, allegations, sources, allegationSources } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validatePublication, withAudit } from "@/db/persist";
import { getSession, unauthorizedResponse, forbiddenResponse, require2FA } from "@/lib/session";
import { hasRole, canPublish } from "@/lib/auth";
import { rateLimitResponse } from "@/lib/rate-limit";
// v1.4 H1: strip the wizard's interim encodings before they reach the PUBLIC record.
// Both strippers are pure/server-safe (framework-free, zero runtime deps): `stripRoleClause`
// removes the appended `ROLE_CLAUSE_TOKEN<slug>` clause from entityRole; `stripSourceType`
// removes the `[TYPE: <slug>] ` prefix from a source title. Reusing the canonical helpers
// (single source of truth) instead of re-implementing the regexes here.
import { stripRoleClause } from "@/lib/wizard/encoding";
import { stripSourceType } from "@/components/wizard/review-helpers";

/* ---------- GET: list pending submissions ---------- */
export async function GET(request: Request) {
  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 30 });
  if (!rl.ok) return rl.response;

  const session = await getSession();
  if (!session || !hasRole(session.user.role ?? "", "reviewer")) {
    return forbiddenResponse("Reviewer access required.");
  }
  if (!require2FA(session)) {
    return forbiddenResponse("Two-factor authentication required for staff.");
  }

  const pending = await db.query.submissions.findMany({
    where: (s, { eq, or }) => or(eq(s.status, "pending"), eq(s.status, "verified")),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
    limit: 50,
  });
  return NextResponse.json({ ok: true, submissions: pending });
}

/* ---------- POST: review action ---------- */
export async function POST(request: Request) {
  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 20 });
  if (!rl.ok) return rl.response;

  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse("Authentication required.");
    }
    if (!require2FA(session)) {
      return forbiddenResponse("Two-factor authentication required for staff.");
    }

    const body = await request.json();
    const { action, submissionId } = body;

    if (!["triage", "reject", "approve", "second_approve", "publish"].includes(action)) {
      return NextResponse.json({ ok: false, message: "Invalid action" }, { status: 400 });
    }

    const actorId = Number(session.user.id);
    const actorRole = (session.user.role ?? "submitter") as "submitter" | "reviewer" | "senior_reviewer" | "admin";

    if (action === "publish" && !canPublish(actorRole)) {
      return forbiddenResponse("Senior reviewer or admin required to publish.");
    }

    if (["triage", "reject", "approve", "second_approve"].includes(action) && !hasRole(actorRole, "reviewer")) {
      return forbiddenResponse("Reviewer access required.");
    }

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json({ ok: false, message: "Submission not found" }, { status: 404 });
    }

    /* ---------- TRIAGE ---------- */
    if (action === "triage") {
      const updateData: Partial<typeof submissions.$inferInsert> = {
        triageConfirmedActor: body.triageConfirmedActor ?? submission.triageConfirmedActor,
        triageConfirmedConduct: body.triageConfirmedConduct ?? submission.triageConfirmedConduct,
        triageCategory: body.triageCategory ?? submission.triageCategory,
        identityResolutionConfirmed: body.identityResolutionConfirmed ?? submission.identityResolutionConfirmed,
        sourceVerification: body.sourceVerification ?? submission.sourceVerification,
        evidenceStrength: body.evidenceStrength ?? submission.evidenceStrength,
        privacyCheckPassed: body.privacyCheckPassed ?? submission.privacyCheckPassed,
        phrasingApproved: body.phrasingApproved ?? submission.phrasingApproved,
        privacyRechecked: body.privacyRechecked ?? submission.privacyRechecked,
        isDeceased: body.isDeceased ?? submission.isDeceased,
      };

      await withAudit(
        { actorId, actorRole },
        () => db.update(submissions).set(updateData).where(eq(submissions.id, submissionId)).returning(),
        { action: "update", targetTable: "submissions", submissionId }
      );
      return NextResponse.json({ ok: true, message: "Triage data saved." });
    }

    /* ---------- REJECT ---------- */
    if (action === "reject") {
      await withAudit(
        { actorId, actorRole, reason: body.notes ?? undefined },
        () =>
          db
            .update(submissions)
            .set({ status: "rejected", rejectionNote: body.notes ?? null, reviewedBy: actorId, reviewedAt: new Date() })
            .where(eq(submissions.id, submissionId))
            .returning(),
        { action: "reject", targetTable: "submissions", submissionId }
      );
      return NextResponse.json({ ok: true, message: "Submission rejected." });
    }

    /* ---------- FIRST APPROVE ---------- */
    if (action === "approve") {
      if (submission.status !== "pending") {
        return NextResponse.json({ ok: false, message: "Submission is not pending review." }, { status: 400 });
      }
      if (submission.reviewedBy === actorId) {
        return NextResponse.json({ ok: false, message: "You cannot be both first and second reviewer." }, { status: 400 });
      }

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
      return NextResponse.json({ ok: true, message: "Submission verified. Awaiting second review." });
    }

    /* ---------- SECOND APPROVE ---------- */
    if (action === "second_approve") {
      if (submission.status !== "verified") {
        return NextResponse.json({ ok: false, message: "Submission awaits first review." }, { status: 400 });
      }
      if (!submission.reviewedBy) {
        return NextResponse.json({ ok: false, message: "No first reviewer recorded." }, { status: 400 });
      }
      if (submission.reviewedBy === actorId) {
        return NextResponse.json({ ok: false, message: "You cannot review your own submission." }, { status: 400 });
      }

      // VERIFY-04 checks
      if (!submission.triageConfirmedActor || !submission.triageConfirmedConduct) {
        return NextResponse.json({ ok: false, message: "Triage not complete — actor and conduct must be confirmed." }, { status: 400 });
      }
      if (!submission.identityResolutionConfirmed) {
        return NextResponse.json({ ok: false, message: "Identity resolution not confirmed." }, { status: 400 });
      }
      if (!submission.evidenceStrength) {
        return NextResponse.json({ ok: false, message: "Evidence strength not assigned." }, { status: 400 });
      }
      if (!submission.privacyCheckPassed) {
        return NextResponse.json({ ok: false, message: "Privacy check not passed." }, { status: 400 });
      }
      if (!submission.phrasingApproved) {
        return NextResponse.json({ ok: false, message: "Phrasing not approved by legal review." }, { status: 400 });
      }
      if (!submission.privacyRechecked) {
        return NextResponse.json({ ok: false, message: "Privacy not rechecked before second review." }, { status: 400 });
      }

      await withAudit(
        { actorId, actorRole },
        () =>
          db
            .update(submissions)
            .set({ status: "ready_to_publish", secondReviewedBy: actorId, secondReviewedAt: new Date() })
            .where(eq(submissions.id, submissionId))
            .returning(),
        { action: "verify", targetTable: "submissions", submissionId }
      );
      return NextResponse.json({ ok: true, message: "Second review complete. Ready to publish." });
    }

    /* ---------- PUBLISH ---------- */
    if (action === "publish") {
      if (submission.status !== "ready_to_publish") {
        return NextResponse.json({ ok: false, message: "Submission must pass dual review before publish." }, { status: 400 });
      }

      // Hard boundary: check lawyer sign-off for living persons
      const pubCheck = validatePublication({
        entityName: submission.entityName,
        isDeceased: submission.isDeceased === true,
        hasLawyerSignOff: body.hasLawyerSignOff === true,
        sourceCount: Array.isArray(submission.sourceLinks) ? submission.sourceLinks.length : 0,
      });

      if (!pubCheck.ok) {
        return NextResponse.json({ ok: false, code: pubCheck.code, message: pubCheck.message }, { status: 403 });
      }

      // Create entity from submission
      const publicId = `ent-${Date.now().toString(36)}`;
      const [entity] = await withAudit(
        { actorId, actorRole, reason: body.notes ?? undefined },
        () =>
          db
            .insert(entities)
            .values({
              publicId,
              type: submission.entityType,
              name: submission.entityName,
              // v1.4 H1: strip the interim ` — role in act: <slug>` clause so the
              // published role is the clean documented title, not the wizard token.
              role: stripRoleClause(submission.entityRole),
              status: "alleged",
              evidenceLevel: (submission.evidenceStrength ?? "1") as "0" | "1" | "2" | "3" | "4",
              isDeceased: submission.isDeceased === true,
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

      // Create sources from verified submission links
      interface SourceVerification {
        tier?: "A" | "B" | "C";
        publisher?: string;
        contentHash?: string;
        snapshotUrl?: string;
        verified?: boolean;
      }

      const sourceLinks = Array.isArray(submission.sourceLinks) ? submission.sourceLinks : [];
      const sourceVerification = (submission.sourceVerification as SourceVerification[]) ?? [];
      for (let i = 0; i < sourceLinks.length; i++) {
        const link = sourceLinks[i];
        const verification = sourceVerification[i] ?? {};
        // v1.4 H1: strip the interim `[TYPE: <slug>] ` prefix so the published source
        // title is the clean title, not the wizard provenance token.
        const cleanTitle = stripSourceType(link.title ?? "").title.trim();
        const [source] = await withAudit(
          { actorId, actorRole },
          () =>
            db
              .insert(sources)
              .values({
                tier: verification.tier ?? "C",
                title: cleanTitle.length > 0 ? cleanTitle : "Untitled source",
                publisher: verification.publisher ?? "Submitted source",
                date: new Date().toISOString().slice(0, 10),
                url: link.url,
                contentHash: verification.contentHash ?? null,
                snapshotUrl: verification.snapshotUrl ?? null,
                verifiedAt: verification.verified ? new Date() : null,
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
