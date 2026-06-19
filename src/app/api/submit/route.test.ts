import { describe, it, expect, beforeEach, vi } from "vitest";

/* ----------------------------- mocks ----------------------------- */

// DB: insert(...).values(...).returning() → one fake row. We spy on insert to assert
// the honeypot path NEVER reaches it.
const insertMock = vi.fn();
const returningMock = vi.fn(async () => [{ id: 4242, entityName: "Acme", status: "pending" }]);
vi.mock("@/db", () => ({
  db: {
    insert: (...args: unknown[]) => {
      insertMock(...args);
      return { values: () => ({ returning: returningMock }) };
    },
  },
}));
// NOTE: @/db/schema is NOT mocked — drizzle-zod (via @/lib/validation) needs the real
// Drizzle table objects to build createInsertSchema. The route only reads `submissions`
// from it, which is harmless to import for real.

// persist: validateSubmission advisory (ok by default); withAudit just runs the cb.
vi.mock("@/db/persist", () => ({
  validateSubmission: vi.fn(() => ({ ok: true })),
  withAudit: vi.fn(async (_meta: unknown, cb: () => Promise<unknown>) => cb()),
}));

// Keep the real conduct constants (schema.ts + validation.ts need conductTypes/
// roleInConductTypes for pgEnum/Zod); only stub triageFromConduct.
vi.mock("@/lib/constants/conduct", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/constants/conduct")>();
  return { ...actual, triageFromConduct: vi.fn(() => "manual_review") };
});

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => null),
  getInternalUserId: vi.fn(async () => 0),
}));

// Telegram + PDF must NOT run during tests (fire-and-forget side effects).
vi.mock("@/lib/telegram", () => ({ sendPdfToTelegram: vi.fn(async () => undefined) }));
vi.mock("@/lib/report-pdf", () => ({ generateSubmissionPdf: vi.fn(async () => Buffer.from("")) }));

// Rate limiter: allow by default (both the IP submit limiter and issuance limiter).
vi.mock("@/lib/rate-limit", () => ({
  rateLimitResponse: vi.fn(async () => ({ ok: true })),
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 9, resetAt: new Date() })),
}));

// Challenge lib: controllable verify/generate.
vi.mock("@/lib/challenge", () => ({
  generateChallenge: vi.fn(() => ({ a: 3, b: 4, op: "+", token: "fresh.token" })),
  verifyChallenge: vi.fn(async () => ({ ok: false })),
}));

import { POST } from "@/app/api/submit/route";
import { verifyChallenge, generateChallenge } from "@/lib/challenge";
import { checkRateLimit } from "@/lib/rate-limit";

const mockedVerify = vi.mocked(verifyChallenge);
const mockedGenerate = vi.mocked(generateChallenge);
const mockedCheckRateLimit = vi.mocked(checkRateLimit);

/* ----------------------------- helpers ----------------------------- */

function validPayload(extra: Record<string, unknown> = {}) {
  return {
    recaptchaToken: "tok",
    entityName: "Acme Corp",
    entityType: "organization",
    reportCategory: "commercial",
    reportMetadata: {},
    entityRole: "owner of record",
    allegationDescription: "A sufficiently long allegation description for validation.",
    sourceLinks: [{ url: "https://example.com/report" }],
    sourceFiles: [],
    isAnonymous: true,
    ...extra,
  };
}

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.7" },
    body: JSON.stringify(body),
  });
}

/** Stub global.fetch (reCAPTCHA siteverify). score controls the v3 verdict. */
function stubSiteverify(success: boolean, score?: number) {
  global.fetch = vi.fn(async () => ({
    json: async () => ({ success, score }),
  })) as unknown as typeof fetch;
}

beforeEach(() => {
  process.env.RECAPTCHA_SECRET_KEY = "recaptcha-secret";
  process.env.CHALLENGE_SIGNING_SECRET = "challenge-secret-xxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  insertMock.mockClear();
  returningMock.mockClear();
  mockedVerify.mockReset();
  mockedVerify.mockResolvedValue({ ok: false });
  mockedGenerate.mockReset();
  mockedGenerate.mockReturnValue({ a: 3, b: 4, op: "+", token: "fresh.token" });
  mockedCheckRateLimit.mockReset();
  mockedCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: new Date() });
});

/* ----------------------------- tests ----------------------------- */

describe("POST /api/submit — honeypot first gate", () => {
  it("filled honeypot → no DB insert and a non-revealing response", async () => {
    stubSiteverify(true, 0.9); // even with a healthy score, honeypot wins first
    const res = await POST(makeRequest(validPayload({ website: "http://spam.example" })));
    expect(insertMock).not.toHaveBeenCalled();
    const data = await res.json();
    // Non-leaking: response must NOT name "honeypot" or "website".
    const serialized = JSON.stringify(data).toLowerCase();
    expect(serialized).not.toContain("honeypot");
    expect(serialized).not.toContain("website");
  });
});

describe("POST /api/submit — gray-band escalation", () => {
  it("high score (>=0.5) → persists silently, NO challenge in response", async () => {
    stubSiteverify(true, 0.8);
    const res = await POST(makeRequest(validPayload()));
    const data = await res.json();
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(data.ok).toBe(true);
    expect(data.submissionId).toBe(4242);
    expect(data.code).not.toBe("CHALLENGE_REQUIRED");
    expect(data.challenge).toBeUndefined();
  });

  it("low score → CHALLENGE_REQUIRED with fresh puzzle, NOT persisted", async () => {
    stubSiteverify(true, 0.1); // below 0.5
    const res = await POST(makeRequest(validPayload()));
    const data = await res.json();
    expect(insertMock).not.toHaveBeenCalled();
    expect(data.code).toBe("CHALLENGE_REQUIRED");
    expect(data.challenge).toMatchObject({ a: 3, b: 4, op: "+", token: "fresh.token" });
  });

  it("missing reCAPTCHA token → CHALLENGE_REQUIRED (not a hard 400)", async () => {
    stubSiteverify(true, 0.9);
    const body = validPayload();
    delete (body as Record<string, unknown>).recaptchaToken;
    const res = await POST(makeRequest(body));
    const data = await res.json();
    expect(insertMock).not.toHaveBeenCalled();
    expect(data.code).toBe("CHALLENGE_REQUIRED");
  });

  it("valid challenge on resubmit (low score) → verifyChallenge passes → PERSISTS", async () => {
    stubSiteverify(true, 0.1);
    mockedVerify.mockResolvedValueOnce({ ok: true });
    const res = await POST(
      makeRequest(validPayload({ challengeToken: "fresh.token", challengeAnswer: "7" }))
    );
    const data = await res.json();
    expect(mockedVerify).toHaveBeenCalledWith("fresh.token", "7");
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(data.ok).toBe(true);
  });

  it("wrong/expired challenge answer → re-issues a NEW puzzle, never a hard block", async () => {
    stubSiteverify(true, 0.1);
    mockedVerify.mockResolvedValueOnce({ ok: false });
    const res = await POST(
      makeRequest(validPayload({ challengeToken: "old.token", challengeAnswer: "999" }))
    );
    const data = await res.json();
    expect(insertMock).not.toHaveBeenCalled();
    expect(data.code).toBe("CHALLENGE_REQUIRED");
    expect(data.challenge).toMatchObject({ token: "fresh.token" });
  });

  it("issuance rate-limited → 429 RATE_LIMITED instead of a puzzle", async () => {
    stubSiteverify(true, 0.1);
    // challenge-issue:* limiter says no
    mockedCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: new Date() });
    const res = await POST(makeRequest(validPayload()));
    const data = await res.json();
    expect(res.status).toBe(429);
    expect(data.code).toBe("RATE_LIMITED");
  });
});
