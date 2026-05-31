import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { validateSubmission, withAudit } from "@/db/persist";
import { submitSchema } from "@/lib/validation";
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
    if (!session) {
      return unauthorizedResponse("Authentication required to submit evidence.");
    }

    const actorId = Number(session.user.id);
    const actorRole = session.user.role as "submitter" | "reviewer" | "senior_reviewer" | "admin";

    const [submission] = await withAudit(
      { actorId, actorRole },
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
            sourceLinks: data.sourceLinks,
            sourceFiles: data.sourceFiles ?? [],
            submitterEmail: data.submitterEmail ?? null,
            submitterName: data.submitterName ?? null,
            isAnonymous: data.isAnonymous,
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
