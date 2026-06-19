import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// The single-use nonce check rides on the PG-backed rate limiter. Unit-isolate it
// so these tests never touch the DB; per-case we control allowed:true/false to
// simulate first-use vs replay.
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 0,
    resetAt: new Date(Date.now() + 5 * 60_000),
  })),
}));

import { checkRateLimit } from "@/lib/rate-limit";
import {
  generateChallenge,
  verifyChallenge,
  normalizeArabicDigits,
} from "@/lib/challenge";

const mockedCheckRateLimit = vi.mocked(checkRateLimit);

const TEST_SECRET = "test-secret-do-not-use-in-prod-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

/** Compute the canonical correct answer for a generated challenge. */
function answerFor(a: number, b: number, op: "+" | "-"): number {
  return op === "+" ? a + b : a - b;
}

beforeEach(() => {
  process.env.CHALLENGE_SIGNING_SECRET = TEST_SECRET;
  mockedCheckRateLimit.mockReset();
  // default: first use of a nonce is allowed
  mockedCheckRateLimit.mockResolvedValue({
    allowed: true,
    remaining: 0,
    resetAt: new Date(Date.now() + 5 * 60_000),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("normalizeArabicDigits", () => {
  it("maps Arabic-Indic digits ٠-٩ to Western 0-9", () => {
    expect(normalizeArabicDigits("٧")).toBe("7");
    expect(normalizeArabicDigits("١٢٣")).toBe("123");
    expect(normalizeArabicDigits("٠")).toBe("0");
  });

  it("leaves Western digits untouched", () => {
    expect(normalizeArabicDigits("7")).toBe("7");
    expect(normalizeArabicDigits("123")).toBe("123");
  });
});

describe("generateChallenge", () => {
  it("returns structured operands and a token (not a rendered sentence)", () => {
    const c = generateChallenge();
    expect(typeof c.a).toBe("number");
    expect(typeof c.b).toBe("number");
    expect(["+", "-"]).toContain(c.op);
    expect(typeof c.token).toBe("string");
    expect(c.token.includes(".")).toBe(true);
  });

  it("keeps subtraction non-negative (human-trivial)", () => {
    for (let i = 0; i < 50; i++) {
      const c = generateChallenge();
      if (c.op === "-") expect(c.a - c.b).toBeGreaterThanOrEqual(0);
    }
  });

  it("binds the operands (not the answer or its hash) into the signed payload", () => {
    const c = generateChallenge();
    const payloadB64 = c.token.split(".")[0];
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    // Operands ARE present (public, HMAC-bound).
    expect(payload.a).toBe(c.a);
    expect(payload.b).toBe(c.b);
    expect(payload.op).toBe(c.op);
    // The answer and any hash of it must NOT be in the token.
    expect(payload).not.toHaveProperty("answerHash");
    const answer = answerFor(c.a, c.b, c.op);
    expect(JSON.stringify(payload)).not.toContain(`"answer"`);
    // Sanity: the plaintext answer value is not embedded as its own field.
    expect(payload.answer).toBeUndefined();
    expect(typeof answer).toBe("number");
  });
});

describe("verifyChallenge", () => {
  it("happy path: correct answer → { ok: true }", async () => {
    const c = generateChallenge();
    const res = await verifyChallenge(c.token, String(answerFor(c.a, c.b, c.op)));
    expect(res.ok).toBe(true);
  });

  it("wrong answer → { ok: false }", async () => {
    const c = generateChallenge();
    const wrong = answerFor(c.a, c.b, c.op) + 1;
    const res = await verifyChallenge(c.token, String(wrong));
    expect(res.ok).toBe(false);
  });

  it("Arabic-Indic digit answer (٧) is accepted equivalently to 7", async () => {
    // Generate until the canonical answer is exactly 7 so we can assert ٧ works.
    let c = generateChallenge();
    let guard = 0;
    while (answerFor(c.a, c.b, c.op) !== 7 && guard < 5000) {
      c = generateChallenge();
      guard++;
    }
    expect(answerFor(c.a, c.b, c.op)).toBe(7);
    const res = await verifyChallenge(c.token, "٧");
    expect(res.ok).toBe(true);
  });

  it("expired token → { ok: false } (does not throw)", async () => {
    const c = generateChallenge();
    // Jump >5 min into the future so the embedded exp is in the past.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 6 * 60_000));
    try {
      const res = await verifyChallenge(c.token, String(answerFor(c.a, c.b, c.op)));
      expect(res.ok).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tampered HMAC (flipped signature byte) → { ok: false }", async () => {
    const c = generateChallenge();
    const [payloadSeg, sigSeg] = c.token.split(".");
    // Flip a character in the signature segment.
    const firstChar = sigSeg[0];
    const flipped = (firstChar === "A" ? "B" : "A") + sigSeg.slice(1);
    const tamperedToken = `${payloadSeg}.${flipped}`;
    const res = await verifyChallenge(tamperedToken, String(answerFor(c.a, c.b, c.op)));
    expect(res.ok).toBe(false);
  });

  it("tampered payload (attacker swaps in easier operands) → { ok: false }", async () => {
    const c = generateChallenge();
    const [, sigSeg] = c.token.split(".");
    // Swap in a different (attacker-built) payload — e.g. an easier puzzle whose answer
    // the attacker knows — while keeping the old signature. The HMAC no longer matches,
    // so the operand swap is rejected before the answer is ever recomputed.
    const forgedPayload = Buffer.from(
      JSON.stringify({ a: 1, b: 1, op: "+", exp: Date.now() + 60_000, nonce: "x" })
    ).toString("base64url");
    const res = await verifyChallenge(`${forgedPayload}.${sigSeg}`, "2");
    expect(res.ok).toBe(false);
  });

  it("token with extra dots (≠ 2 segments) → { ok: false }", async () => {
    const c = generateChallenge();
    const res = await verifyChallenge(`${c.token}.extra`, String(answerFor(c.a, c.b, c.op)));
    expect(res.ok).toBe(false);
  });

  it("non-numeric answer (e.g. \"7abc\") → { ok: false }", async () => {
    // Generate until the canonical answer is exactly 7 so "7abc" would parseInt to 7.
    let c = generateChallenge();
    let guard = 0;
    while (answerFor(c.a, c.b, c.op) !== 7 && guard < 5000) {
      c = generateChallenge();
      guard++;
    }
    expect(answerFor(c.a, c.b, c.op)).toBe(7);
    // Strict integer check rejects the trailing garbage rather than truncating to 7.
    const res = await verifyChallenge(c.token, "7abc");
    expect(res.ok).toBe(false);
  });

  it("empty answer → { ok: false } (does not throw)", async () => {
    const c = generateChallenge();
    const res = await verifyChallenge(c.token, "");
    expect(res.ok).toBe(false);
  });

  it("nonce-consume throw on the human recovery path → { ok: false }, never throws", async () => {
    const c = generateChallenge();
    const correct = String(answerFor(c.a, c.b, c.op));
    // Simulate a concurrent unique-key race / transient DB hiccup on the nonce consume.
    mockedCheckRateLimit.mockRejectedValueOnce(new Error("unique violation"));
    const res = await verifyChallenge(c.token, correct);
    expect(res.ok).toBe(false);
  });

  it("replayed (single-use): first verify ok, second rejected via consumed nonce", async () => {
    const c = generateChallenge();
    const correct = String(answerFor(c.a, c.b, c.op));
    // First verify: nonce unused → allowed:true
    mockedCheckRateLimit.mockResolvedValueOnce({
      allowed: true,
      remaining: 0,
      resetAt: new Date(Date.now() + 5 * 60_000),
    });
    const first = await verifyChallenge(c.token, correct);
    expect(first.ok).toBe(true);

    // Second verify of the SAME token: nonce already consumed → allowed:false
    mockedCheckRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 5 * 60_000),
    });
    const second = await verifyChallenge(c.token, correct);
    expect(second.ok).toBe(false);
  });
});

describe("CHALLENGE_SIGNING_SECRET fail-fast", () => {
  it("generateChallenge throws a clear error when the secret is unset (no insecure default)", () => {
    delete process.env.CHALLENGE_SIGNING_SECRET;
    expect(() => generateChallenge()).toThrow(/CHALLENGE_SIGNING_SECRET/);
  });

  it("verifyChallenge throws a clear error when the secret is unset", async () => {
    // Build a token while the secret IS set, then unset it for verify.
    process.env.CHALLENGE_SIGNING_SECRET = TEST_SECRET;
    const c = generateChallenge();
    delete process.env.CHALLENGE_SIGNING_SECRET;
    await expect(
      verifyChallenge(c.token, String(answerFor(c.a, c.b, c.op)))
    ).rejects.toThrow(/CHALLENGE_SIGNING_SECRET/);
  });
});
