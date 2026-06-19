/**
 * Self-hosted, deterministic visible math challenge for the intake gray-band.
 *
 * Layered ON TOP of reCAPTCHA v3 + the PG rate limiter. When v3 is low/missing/errored,
 * the submit route does NOT hard-block — it issues one of these signed puzzles and a
 * genuine human (Tor/VPN, low score) can always complete by answering it.
 *
 * Security model:
 * - The token carries the OPERANDS { a, b, op, exp, nonce } HMAC-SHA256-signed with
 *   CHALLENGE_SIGNING_SECRET. The operands are public (they ARE the visible question),
 *   but they are HMAC-bound so the client cannot swap in an easier puzzle. The answer is
 *   NEITHER in the token NOR hashed into it — on verify the server recomputes the
 *   canonical answer from the trusted (signed) operands and compares it to the user's.
 *   This avoids the earlier brute-forceable answerHash (the answer space is ≤19 values,
 *   so any hash of the answer is trivially reversible). The localized question sentence
 *   is rendered client-side from the operands and is never trusted on verify.
 * - Verify uses crypto.timingSafeEqual (constant-time, length-guarded) so a tampered
 *   signature cannot be brute-forced via timing.
 * - Single-use: the nonce is consumed via checkRateLimit("challenge-nonce:<nonce>",
 *   { maxRequests: 1 }); a replay sees allowed:false and is rejected. The TTL-sized
 *   window self-expires consumed nonces (no new table / migration — reuses rate_limits).
 *
 * No third-party captcha dependency: only Node's built-in `crypto`.
 */

import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";

const TTL_MS = 5 * 60_000; // ~5 minutes

export type ChallengeOp = "+" | "-";

export interface GeneratedChallenge {
  a: number;
  b: number;
  op: ChallengeOp;
  /** base64url(payloadJson) + "." + base64url(hmac) */
  token: string;
}

interface ChallengePayload {
  /** First operand (public — it IS the visible question; HMAC-bound). */
  a: number;
  /** Second operand (public — HMAC-bound). */
  b: number;
  /** Operator (public — HMAC-bound). The answer is recomputed from a/b/op on verify. */
  op: ChallengeOp;
  /** epoch ms expiry. */
  exp: number;
  /** single-use marker consumed via the rate_limits table. */
  nonce: string;
}

/**
 * Read the HMAC signing secret. FAIL FAST: throws a clear Error if unset/empty —
 * there is NO insecure default. This is the project's fail-fast mechanism for this
 * secret (there is no central env-validation module). Called inside generate/verify
 * (never at import top-level) so tests can control the env per case.
 */
function signingSecret(): string {
  const secret = process.env.CHALLENGE_SIGNING_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      "CHALLENGE_SIGNING_SECRET is not set. The intake challenge requires an HMAC key " +
        "(generate with `openssl rand -hex 32`). Refusing to run with an insecure default."
    );
  }
  return secret;
}

function sign(payloadB64: string): string {
  return createHmac("sha256", signingSecret()).update(payloadB64).digest("base64url");
}

/** Map Arabic-Indic digits ٠-٩ (U+0660–U+0669) to Western 0-9. */
export function normalizeArabicDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Canonical answer for a set of operands. Single source of truth for generate + verify. */
function canonicalAnswer(a: number, b: number, op: ChallengeOp): number {
  return op === "+" ? a + b : a - b;
}

/**
 * Build a fresh signed math challenge. Operands are human-trivial (1–9); subtraction
 * is kept non-negative. The operands themselves (a, b, op) are HMAC-bound into the token
 * — NOT the answer or any hash of it. The answer is recomputed server-side from the
 * trusted operands on verify. The operands are also returned so the CLIENT renders the
 * localized bilingual sentence.
 */
export function generateChallenge(): GeneratedChallenge {
  const op: ChallengeOp = randomInt(0, 2) === 0 ? "+" : "-";
  let a = randomInt(1, 10); // 1–9
  let b = randomInt(1, 10); // 1–9
  if (op === "-" && b > a) {
    // keep the result non-negative by swapping
    [a, b] = [b, a];
  }

  const payload: ChallengePayload = {
    a,
    b,
    op,
    exp: Date.now() + TTL_MS,
    nonce: randomUUID(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(payloadB64);
  const token = `${payloadB64}.${sig}`;

  return { a, b, op, token };
}

export interface VerifyResult {
  ok: boolean;
}

/**
 * Verify a challenge token + answer. Order: token shape → HMAC (constant-time) → TTL →
 * answer (recomputed from the trusted operands) → single-use nonce. Any failed step
 * returns { ok:false } (never throws on bad input; the ONLY throw is the fail-fast
 * missing-secret guard). Never logs the secret or token.
 */
export async function verifyChallenge(token: string, rawAnswer: string): Promise<VerifyResult> {
  if (typeof token !== "string") return { ok: false };

  // Require EXACTLY 2 dot-separated segments. A token with extra dots is malformed and
  // could shift the signed boundary — reject before any HMAC work.
  const segments = token.split(".");
  if (segments.length !== 2) return { ok: false };
  const [payloadB64, sigB64] = segments;
  if (!payloadB64 || !sigB64) return { ok: false };

  // 1. HMAC — recompute over the payload segment and compare in constant time.
  //    (signingSecret() throws here if the secret is unset — fail-fast.)
  const expectedSig = sign(payloadB64);
  const given = Buffer.from(sigB64);
  const expected = Buffer.from(expectedSig);
  if (given.length !== expected.length) return { ok: false }; // length-guard before timingSafeEqual
  if (!timingSafeEqual(given, expected)) return { ok: false };

  // 2. Parse payload (HMAC already verified integrity).
  let payload: ChallengePayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { ok: false };
  }
  if (
    !payload ||
    typeof payload.a !== "number" ||
    typeof payload.b !== "number" ||
    (payload.op !== "+" && payload.op !== "-") ||
    typeof payload.exp !== "number" ||
    typeof payload.nonce !== "string"
  ) {
    return { ok: false };
  }

  // 3. TTL.
  if (Date.now() > payload.exp) return { ok: false };

  // 4. Answer: normalize Arabic-Indic digits, trim, strict-integer parse, then compare
  //    against the answer RECOMPUTED from the trusted (HMAC-bound) operands. A strict
  //    integer match rejects "7abc"/"" rather than silently truncating via parseInt.
  const normalized = normalizeArabicDigits(String(rawAnswer ?? "")).trim();
  if (!/^-?\d+$/.test(normalized)) return { ok: false };
  const parsed = Number.parseInt(normalized, 10);
  if (Number.isNaN(parsed)) return { ok: false };
  if (parsed !== canonicalAnswer(payload.a, payload.b, payload.op)) return { ok: false };

  // 5. Single-use: consume the nonce ONLY after the answer is verified correct (a wrong
  //    answer must not burn the nonce). First use → allowed:true; replay → allowed:false.
  //    Fail-safe: a thrown error (e.g. a concurrent unique-key race or a transient DB
  //    hiccup) is treated as a re-challenge — NEVER propagated as a 500 that would lock
  //    out a gray-band human. The loser of a race is, correctly, a replay.
  try {
    const { allowed } = await checkRateLimit(`challenge-nonce:${payload.nonce}`, {
      windowMs: TTL_MS,
      maxRequests: 1,
    });
    if (!allowed) return { ok: false };
  } catch {
    return { ok: false };
  }

  return { ok: true };
}
