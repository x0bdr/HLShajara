import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { validateSubmission, withAudit } from "@/db/persist";
import { submitSchema } from "@/lib/validation";
import { triageFromConduct } from "@/lib/constants/conduct";
import { getSession, getInternalUserId } from "@/lib/session";
import { rateLimitResponse, checkRateLimit } from "@/lib/rate-limit";
import { generateChallenge, verifyChallenge } from "@/lib/challenge";
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
    // `website` is the honeypot field (see submitSchema). Pull challenge fields too.
    // Everything else flows into the schema parse via `payload`.
    const { recaptchaToken, website: honeypot, challengeToken, challengeAnswer, ...payload } = body;

    // ---------------------------------------------------------------------
    // GATE 1 — HONEYPOT (FIRST, before reCAPTCHA / any DB work).
    // A non-empty honeypot means a bot filled a field real users never see.
    // We DELIBERATELY return a non-revealing response (a fake-success-shaped 200
    // with no real row + no submissionId) so a scraper cannot diff responses to
    // learn the field exists and skip it next time. NO DB write occurs here.
    // ---------------------------------------------------------------------
    if (typeof honeypot === "string" && honeypot.trim().length > 0) {
      return NextResponse.json({
        ok: true,
        message: "Submission received and queued for review.",
      });
    }

    // ---------------------------------------------------------------------
    // GATE 2/3 — reCAPTCHA v3 with GRAY-BAND escalation.
    // A missing token or a low/errored v3 score no longer hard-blocks. Instead the
    // request enters the gray band: a verified math challenge SUBSTITUTES for the v3
    // gate so a genuine human (Tor/VPN, low score) can always complete. This is the
    // one deliberate fail-OPEN exception, bounded by the signed single-use puzzle.
    // ---------------------------------------------------------------------
    const recaptchaOk =
      typeof recaptchaToken === "string" && recaptchaToken.length > 0
        ? await verifyRecaptcha(recaptchaToken)
        : false;

    let challengePassed = false;
    if (!recaptchaOk) {
      // If THIS request carries a challenge answer, it may substitute for the v3 gate.
      if (typeof challengeToken === "string" && typeof challengeAnswer === "string") {
        const verdict = await verifyChallenge(challengeToken, challengeAnswer);
        challengePassed = verdict.ok;
      }

      if (!challengePassed) {
        // Re-issue a fresh puzzle. Rate-limit issuance per IP so the gray band cannot
        // be abused to spam puzzle generation (DoS).
        const ipKey = ip === "unknown" ? "unknown" : createHash("sha256").update(ip).digest("hex");
        const issue = await checkRateLimit(`challenge-issue:${ipKey}`, {
          windowMs: 60_000,
          maxRequests: 10,
        });
        if (!issue.allowed) {
          return NextResponse.json(
            { ok: false, code: "RATE_LIMITED", message: "Too many requests. Please wait." },
            { status: 429 }
          );
        }

        const { a, b, op, token } = generateChallenge();
        // Transport choice: HTTP 200 with a discriminated body. 200 (not 4xx/409)
        // keeps this off the browser's network-error path and is the simplest signal
        // for the client to branch on (`data.code === "CHALLENGE_REQUIRED"`). It is
        // NOT a success — the body's `ok:false` + `code` carry the real outcome.
        return NextResponse.json({
          ok: false,
          code: "CHALLENGE_REQUIRED",
          message: "Please answer the quick check to confirm you're human.",
          challenge: { a, b, op, token },
        });
      }
    }

    // Reached by EITHER a healthy v3 score OR a verified challenge. Single shared
    // parse + advisory screen + insert block below — no validation is skipped on the
    // challenge path.
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
