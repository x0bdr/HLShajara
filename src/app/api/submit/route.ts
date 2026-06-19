import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { validateSubmission, withAudit } from "@/db/persist";
import { submitSchema } from "@/lib/validation";
import { triageFromConduct } from "@/lib/constants/conduct";
import { getSession, getInternalUserId } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rate-limit";
import { generateSubmissionPdf } from "@/lib/report-pdf";
import { sendPdfToTelegram } from "@/lib/telegram";

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error("RECAPTCHA_SECRET_KEY is not set");
    return false;
  }
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const json = (await res.json()) as { success?: boolean; score?: number; action?: string };
    return Boolean(json.success && (json.score === undefined || json.score >= 0.5));
  } catch (err) {
    console.error("reCAPTCHA verification error:", err);
    return false;
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 5 });
  if (!rl.ok) return rl.response;

  try {
    const body = await request.json();
    const { recaptchaToken, ...payload } = body;

    if (!recaptchaToken || typeof recaptchaToken !== "string") {
      return NextResponse.json(
        { ok: false, code: "RECAPTCHA_MISSING", message: "reCAPTCHA token is required." },
        { status: 400 }
      );
    }

    const recaptchaOk = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaOk) {
      return NextResponse.json(
        { ok: false, code: "RECAPTCHA_FAILED", message: "reCAPTCHA verification failed." },
        { status: 400 }
      );
    }

    const parsed = submitSchema.safeParse(payload);
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
      sourceLinks: data.sourceLinks,
    });

    // Content screens (Family B) are ADVISORY at intake: a matched screen no longer
    // rejects the submission. Instead the matched code is recorded as a reviewer-facing
    // AUTO-FLAG in the immutable audit log below, preserving the safety signal for
    // human review without blocking on imperfect (esp. Arabic) content heuristics.

    const session = await getSession();
    const isAnonymous = data.isAnonymous || !session;
    const actorId = session ? await getInternalUserId(session) : 0;
    const actorRole = (session?.user.role ?? "submitter") as "submitter" | "reviewer" | "senior_reviewer" | "admin";

    const parts = [
      isAnonymous ? "Anonymous submission" : null,
      !screen.ok ? `AUTO-FLAG:${screen.code}` : null,
    ].filter(Boolean);
    const reason = parts.length ? parts.join("; ") : undefined;

    const [submission] = await withAudit(
      { actorId, actorRole, reason },
      () =>
        db
          .insert(submissions)
          .values({
            status: "pending",
            entityName: data.entityName,
            entityType: data.entityType,
            reportCategory: data.reportCategory,
            reportMetadata: data.reportMetadata ?? {},
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

    // Notify Telegram with a PDF of the new report. Fire-and-forget: never block
    // the submit response or fail the submission if Telegram/PDF generation errors.
    (async () => {
      try {
        const pdfBuffer = await generateSubmissionPdf(submission);
        await sendPdfToTelegram(
          pdfBuffer,
          `report-${submission.id}.pdf`,
          `بلاغ جديد #${submission.id}: ${submission.entityName}`
        );
      } catch (notifyErr) {
        console.error("Telegram notification failed:", notifyErr);
      }
    })();

    return NextResponse.json({
      ok: true,
      submissionId: submission.id,
      message: "Submission received and queued for review.",
      warningCode: !screen.ok ? screen.code : undefined,
    });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    );
  }
}
