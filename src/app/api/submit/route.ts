import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { validateSubmission, withAudit } from "@/db/persist";
import { submitSchema } from "@/lib/validation";
import { triageFromConduct } from "@/lib/constants/conduct";
import { getSession, unauthorizedResponse } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 5 });
  if (!rl.ok) return rl.response;

  try {
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, code: "VALIDATION_ERROR", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const screen = validateSubmission({
      entityName: data.entityName,
      entityRole: data.entityRole,
      entityType: data.entityType,
      allegationDescription: data.allegationDescription,
      sourceCount: data.sourceLinks.length,
      sourceLinks: data.sourceLinks,
    });

    if (!screen.ok) {
      return NextResponse.json(
        { ok: false, code: screen.code, message: screen.message },
        { status: 400 }
      );
    }

    const session = await getSession();
    const isAnonymous = data.isAnonymous || !session;
    const actorId = session ? Number(session.user.id) : 0;
    const actorRole = (session?.user.role ?? "submitter") as "submitter" | "reviewer" | "senior_reviewer" | "admin";

    const [submission] = await withAudit(
      { actorId, actorRole, reason: isAnonymous ? "Anonymous submission" : undefined },
      () =>
        db
          .insert(submissions)
          .values({
            status: "pending",
            entityName: data.entityName,
            entityType: data.entityType,
            entityRole: data.entityRole,
            allegationDescription: data.allegationDescription,
            allegationPeriod: data.allegationPeriod ?? null,
            allegationLocation: data.allegationLocation ?? null,
            allegationClassification: data.allegationClassification ?? null,
            // Phase 33 (BE-01/BE-06): persist first-class conduct/role slugs.
            conductType: data.conductType ?? null,
            roleInConduct: data.roleInConduct ?? null,
            // Phase 33 (BE-01): auto-populate the triage bucket from conductType
            // (deterministic; manual_review fallback). Reviewers can still override
            // via /api/review, which wins post-intake.
            triageCategory: data.conductType ? triageFromConduct(data.conductType) : null,
            // Phase 33 (BE-02): persist the reviewer-only lead note. It is NEVER
            // returned on any public path, NEVER counted as a source (sourceCount
            // below is sourceLinks.length only), NEVER folded into allegationDescription.
            leadNote: data.leadNote ?? null,
            // per-source sourceType (BE-03) rides through the JSONB unchanged.
            sourceLinks: data.sourceLinks,
            sourceFiles: data.sourceFiles ?? [],
            submitterEmail: data.submitterEmail ?? null,
            submitterName: data.submitterName ?? null,
            isAnonymous,
            ipHash: ip === "unknown" ? null : createHash("sha256").update(ip).digest("hex"),
          })
          .returning(),
      { action: "create", targetTable: "submissions" }
    );

    return NextResponse.json({
      ok: true,
      submissionId: submission.id,
      message: "Submission received and queued for review.",
    });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    );
  }
}
